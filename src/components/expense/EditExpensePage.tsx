import { ArrowLeft } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useAuth } from "@/components/auth/AuthProvider"
import type { ExpenseEditData } from "@/components/expense/ExpenseItemEdit"
import ExpenseItemEdit from "@/components/expense/ExpenseItemEdit"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import type { DbExpense, DbGroupMember } from "@/lib/types"

type PageState =
  | { status: "loading" }
  | { status: "not-found" }
  | {
      status: "ready"
      expense: DbExpense
      members: DbGroupMember[]
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

  const { expense, members } = state

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-4 p-6">
      <Button asChild variant="ghost" size="sm" className="w-fit p-0">
        <Link to={groupUrl}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </Button>
      <h2 className="font-semibold text-lg">Edit expense</h2>
      <ExpenseItemEdit
        expense={expense}
        members={members}
        onSave={handleSave}
        onCancel={() => navigate(groupUrl)}
        onDelete={handleDelete}
      />
    </div>
  )
}
