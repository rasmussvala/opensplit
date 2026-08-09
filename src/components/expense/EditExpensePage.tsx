import { ArrowLeft } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  type ExpenseEditingContext,
  manageExpenses,
} from "@/application/expenses/manageExpenses"
import type { Expense, Member } from "@/application/groups/loadGroupSnapshot"
import { useAuth } from "@/components/auth/AuthProvider"
import ExpenseForm, {
  type ExpenseFormData,
} from "@/components/expense/ExpenseForm"
import { LoadingState } from "@/components/ui/loading-state"
import { SupabaseExpenseDataSource } from "@/infrastructure/supabase/supabaseExpenseDataSource"
import { SupabaseGroupDataSource } from "@/infrastructure/supabase/supabaseGroupDataSource"

type PageState =
  | { status: "loading" }
  | { status: "not-found" }
  | {
      status: "ready"
      expense: Expense
      members: Member[]
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
    let context: ExpenseEditingContext | null
    try {
      context = await manageExpenses(
        new SupabaseGroupDataSource(),
        new SupabaseExpenseDataSource(),
      ).loadContext(inviteToken as string, userId, expenseId)
    } catch {
      setState({ status: "not-found" })
      return
    }
    if (!context) {
      setState({ status: "not-found" })
      return
    }
    setState({
      status: "ready",
      expense: context.expense,
      members: context.members,
      currency: context.currency,
    })
  }, [inviteToken, expenseId, userId])

  useEffect(() => {
    void load()
  }, [load])

  async function handleSave(data: ExpenseFormData) {
    if (state.status !== "ready") return

    try {
      await manageExpenses(
        new SupabaseGroupDataSource(),
        new SupabaseExpenseDataSource(),
      ).update(state.expense.id, data)
    } catch {
      return
    }
    navigate(groupUrl)
  }

  async function handleDelete() {
    if (state.status !== "ready") return

    try {
      await manageExpenses(
        new SupabaseGroupDataSource(),
        new SupabaseExpenseDataSource(),
      ).delete(state.expense.id)
    } catch {
      return
    }
    navigate(groupUrl)
  }

  if (state.status === "loading") {
    return <LoadingState centered />
  }

  if (state.status === "not-found") {
    return <p className="p-6 text-center">Expense not found</p>
  }

  const { expense, members, currency } = state
  const createdAt = new Date(expense.createdAt)
  const dateLabel = createdAt
    .toLocaleDateString("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase()

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-2 py-6">
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

      <ExpenseForm
        members={members}
        currency={currency}
        initialDescription={expense.description}
        initialAmount={String(Number(expense.amount))}
        initialPaidBy={expense.paidBy}
        initialSplitAmong={expense.splitAmong}
        initialSplitOverrides={expense.splitOverrides}
        submitLabel="Save"
        onSubmit={handleSave}
        onCancel={() => navigate(groupUrl)}
        onDelete={handleDelete}
      />
    </div>
  )
}
