import { useCallback, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import ExpenseList from "@/components//expense/ExpenseList"
import { useAuth } from "@/components/auth/AuthProvider"
import AddExpense from "@/components/expense/AddExpense"
import InviteLink from "@/components/group/InviteLink"
import JoinGroup from "@/components/group/JoinGroup"
import MemberList from "@/components/group/MemberList"
import { Badge } from "@/components/ui/badge"
import { supabase } from "@/lib/supabase"
import type { DbExpense, DbGroup, DbGroupMember } from "@/lib/types"

type PageState =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "join"; group: DbGroup }
  | {
      status: "member"
      group: DbGroup
      members: DbGroupMember[]
      expenses: DbExpense[]
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

    const [{ data: members }, { data: expenses }] = await Promise.all([
      supabase.from("group_members").select().eq("group_id", group.id),
      supabase.from("expenses").select().eq("group_id", group.id),
    ])

    setState({
      status: "member",
      group,
      members: members ?? [],
      expenses: (expenses ?? []) as DbExpense[],
    })
  }, [inviteToken, userId])

  useEffect(() => {
    loadGroup()
  }, [loadGroup])

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

  const { group, members, expenses } = state

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-4 p-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">{group.name}</h1>
        <Badge variant="secondary">{group.currency}</Badge>
      </div>

      <InviteLink inviteToken={group.invite_token} />
      <MemberList members={members} />
      <AddExpense groupId={group.id} members={members} onAdded={loadGroup} />
      <ExpenseList
        expenses={expenses}
        members={members}
        currency={group.currency}
        onChanged={loadGroup}
      />
    </div>
  )
}
