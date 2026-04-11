import { Plus } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useAuth } from "@/components/auth/AuthProvider"
import BalanceSummary from "@/components/balance/BalanceSummary"
import ExpenseList from "@/components/expense/ExpenseList"
import GroupHeader from "@/components/group/GroupHeader"
import JoinGroup from "@/components/group/JoinGroup"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import type {
  DbExpense,
  DbGroup,
  DbGroupMember,
  DbSettlement,
} from "@/lib/types"

type PageState =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "join"; group: DbGroup }
  | {
      status: "member"
      group: DbGroup
      members: DbGroupMember[]
      expenses: DbExpense[]
      settlements: DbSettlement[]
    }

export default function GroupPage() {
  const { inviteToken } = useParams<{ inviteToken: string }>()
  const { userId } = useAuth()
  const [state, setState] = useState<PageState>({ status: "loading" })

  const loadGroup = useCallback(async () => {
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select()
      .eq("invite_token", inviteToken as string)
      .single()

    if (groupError || !group) {
      setState({ status: "not-found" })
      return
    }

    const { data: membership } = await supabase
      .from("group_members")
      .select()
      .eq("group_id", group.id)
      .eq("user_id", userId)
      .maybeSingle()

    if (!membership) {
      setState({ status: "join", group })
      return
    }

    const [{ data: members }, { data: expenses }, { data: settlements }] =
      await Promise.all([
        supabase.from("group_members").select().eq("group_id", group.id),
        supabase.from("expenses").select().eq("group_id", group.id),
        supabase.from("settlements").select().eq("group_id", group.id),
      ])

    setState({
      status: "member",
      group,
      members: members ?? [],
      expenses: (expenses ?? []) as DbExpense[],
      settlements: (settlements ?? []) as DbSettlement[],
    })
  }, [inviteToken, userId])

  useEffect(() => {
    loadGroup()
  }, [loadGroup])

  const groupId = state.status === "member" ? state.group.id : null

  useEffect(() => {
    if (!groupId) return

    let timeout: ReturnType<typeof setTimeout>

    // No group_id filter: Supabase Realtime cannot filter DELETE events,
    // so we listen to all changes and rely on loadGroup's queries to scope data.
    const refetch = () => {
      clearTimeout(timeout)
      timeout = setTimeout(loadGroup, 300)
    }

    const channel = supabase
      .channel(`group-${groupId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses" },
        refetch,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "settlements" },
        refetch,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_members" },
        refetch,
      )
      .subscribe()

    return () => {
      clearTimeout(timeout)
      supabase.removeChannel(channel)
    }
  }, [groupId, loadGroup])

  if (state.status === "loading") {
    return <p className="p-6 text-center">Loading…</p>
  }

  if (state.status === "not-found") {
    return <p className="p-6 text-center">Group not found</p>
  }

  if (state.status === "join") {
    return (
      <JoinGroup
        groupId={state.group.id}
        groupName={state.group.name}
        onJoined={loadGroup}
      />
    )
  }

  const { group, members, expenses, settlements } = state

  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount), 0)

  async function handleSettle(from: string, to: string, amount: number) {
    await supabase.from("settlements").insert({
      group_id: group.id,
      from_member: from,
      to_member: to,
      amount,
    })
    await loadGroup()
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-4 p-2">
      <GroupHeader group={group} members={members} totalSpent={totalSpent} />

      <BalanceSummary
        expenses={expenses}
        settlements={settlements}
        members={members}
        currency={group.currency}
        onSettle={handleSettle}
      />

      <ExpenseList
        expenses={expenses}
        members={members}
        currency={group.currency}
        inviteToken={inviteToken as string}
      />

      <Button
        asChild
        size="icon"
        className="fixed right-6 bottom-6 h-14 w-14 rounded-full shadow-lg"
      >
        <Link to={`/groups/${inviteToken}/add-expense`}>
          <Plus className="h-6 w-6" />
          <span className="sr-only">Add expense</span>
        </Link>
      </Button>
    </div>
  )
}
