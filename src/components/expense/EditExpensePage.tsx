import { ArrowLeft } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useAuth } from "@/components/auth/AuthProvider"
import type { ExpenseEditData } from "@/components/expense/ExpenseItemEdit"
import ExpenseItemEdit from "@/components/expense/ExpenseItemEdit"
import { supabase } from "@/lib/supabase"
import type { DbExpense, DbGroupMember } from "@/lib/types"

type PageState =
  | { status: "loading" }
  | { status: "not-found" }
  | {
      status: "ready"
      expense: DbExpense
      members: DbGroupMember[]
      currency: string
    }

export default function EditExpensePage() {
  const { inviteToken, expenseId } = useParams<{
    inviteToken: string
    expenseId: string
  }>()
  const { userId } = useAuth()
  const navigate = useNavigate()
  const [state, setState] = useState<PageState>({ status: "loading" })

  const groupUrl = `/groups/${inviteToken}`

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

    const [{ data: members }, { data: expense }] = await Promise.all([
      supabase.from("group_members").select().eq("group_id", group.id),
      supabase
        .from("expenses")
        .select()
        .eq("id", expenseId as string)
        .single(),
    ])

    if (!expense) {
      setState({ status: "not-found" })
      return
    }

    setState({
      status: "ready",
      expense: expense as DbExpense,
      members: members ?? [],
      currency: group.currency,
    })
  }, [inviteToken, expenseId, userId])

  useEffect(() => {
    load()
  }, [load])

  async function handleSave(data: ExpenseEditData) {
    if (state.status !== "ready") return

    const { error } = await supabase
      .from("expenses")
      .update({
        description: data.description,
        amount: data.amount,
        paid_by: data.paidBy,
        split_among: data.splitAmong,
      })
      .eq("id", state.expense.id)

    if (error) return
    navigate(groupUrl)
  }

  async function handleDelete() {
    if (state.status !== "ready") return

    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", state.expense.id)

    if (error) return
    navigate(groupUrl)
  }

  if (state.status === "loading") {
    return <p className="p-6 text-center">Loading...</p>
  }

  if (state.status === "not-found") {
    return <p className="p-6 text-center">Expense not found</p>
  }

  const { expense, members, currency } = state
  const createdAt = new Date(expense.created_at)
  const dateLabel = createdAt
    .toLocaleDateString("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase()

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 p-6">
      <Link
        to={groupUrl}
        className="group inline-flex w-fit items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.14em] transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        Back
      </Link>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.14em]">
          {dateLabel}
        </span>
        <h2 className="font-semibold text-[22px] tracking-tight">
          Edit expense
        </h2>
      </div>

      <ExpenseItemEdit
        expense={expense}
        members={members}
        currency={currency}
        onSave={handleSave}
        onCancel={() => navigate(groupUrl)}
        onDelete={handleDelete}
      />
    </div>
  )
}
