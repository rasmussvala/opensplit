import { ArrowLeft } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useAuth } from "@/components/auth/AuthProvider"
import ExpenseForm, {
  type ExpenseFormData,
} from "@/components/expense/ExpenseForm"
import { LoadingState } from "@/components/ui/loading-state"
import { supabase } from "@/lib/supabase"
import type { DbGroup, DbGroupMember } from "@/lib/types"

type PageState =
  | { status: "loading" }
  | { status: "not-found" }
  | {
      status: "ready"
      group: DbGroup
      members: DbGroupMember[]
      currentMemberId: string
    }

export default function AddExpensePage() {
  const { inviteToken } = useParams<{ inviteToken: string }>()
  const { userId } = useAuth()
  const navigate = useNavigate()
  const [state, setState] = useState<PageState>({ status: "loading" })

  const load = useCallback(async () => {
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
      setState({ status: "not-found" })
      return
    }

    const { data: members } = await supabase
      .from("group_members")
      .select()
      .eq("group_id", group.id)

    const ordered = (members ?? []).slice().sort((a, b) => {
      if (a.id === membership.id) return -1
      if (b.id === membership.id) return 1
      return 0
    })

    setState({
      status: "ready",
      group,
      members: ordered,
      currentMemberId: membership.id,
    })
  }, [inviteToken, userId])

  useEffect(() => {
    load()
  }, [load])

  if (state.status === "loading") {
    return <LoadingState centered />
  }

  if (state.status === "not-found") {
    return <p className="p-6 text-center">Group not found</p>
  }

  const { group, members, currentMemberId } = state
  const groupUrl = `/groups/${inviteToken}`

  async function handleSubmit(data: ExpenseFormData) {
    const { error } = await supabase.from("expenses").insert({
      group_id: group.id,
      description: data.description,
      amount: data.amount,
      paid_by: data.paidBy,
      split_among: data.splitAmong,
      split_overrides: data.splitOverrides,
    })

    if (error) return

    navigate(groupUrl)
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-2 py-6">
      <Link
        to={groupUrl}
        className="group inline-flex w-fit items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.14em] transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        Back
      </Link>

      <h2 className="font-semibold text-[22px] tracking-tight">New expense</h2>

      <ExpenseForm
        members={members}
        currency={group.currency}
        initialPaidBy={currentMemberId}
        submitLabel="Add expense"
        onSubmit={handleSubmit}
      />
    </div>
  )
}
