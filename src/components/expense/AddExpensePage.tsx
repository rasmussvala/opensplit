import { ArrowLeft } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  type ExpenseCreationContext,
  manageExpenses,
} from "@/application/expenses/manageExpenses"
import type { Member } from "@/application/groups/loadGroupSnapshot"
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
      groupId: string
      currency: string
      members: Member[]
      currentMemberId: string
    }

export default function AddExpensePage() {
  const { inviteToken } = useParams<{ inviteToken: string }>()
  const { userId } = useAuth()
  const navigate = useNavigate()
  const [state, setState] = useState<PageState>({ status: "loading" })

  const load = useCallback(async () => {
    let context: ExpenseCreationContext | null
    try {
      context = await manageExpenses(
        new SupabaseGroupDataSource(),
        new SupabaseExpenseDataSource(),
      ).loadCreateContext(inviteToken as string, userId)
    } catch {
      setState({ status: "not-found" })
      return
    }
    if (!context) {
      setState({ status: "not-found" })
      return
    }
    const ordered = context.members.slice().sort((a, b) => {
      if (a.id === context.currentMemberId) return -1
      if (b.id === context.currentMemberId) return 1
      return 0
    })
    setState({
      status: "ready",
      groupId: context.groupId,
      currency: context.currency,
      members: ordered,
      currentMemberId: context.currentMemberId,
    })
  }, [inviteToken, userId])

  useEffect(() => {
    void load()
  }, [load])

  if (state.status === "loading") {
    return <LoadingState centered />
  }

  if (state.status === "not-found") {
    return <p className="p-6 text-center">Group not found</p>
  }

  const { groupId, members, currency, currentMemberId } = state
  const groupUrl = `/groups/${inviteToken}`

  async function handleSubmit(data: ExpenseFormData) {
    try {
      await manageExpenses(
        new SupabaseGroupDataSource(),
        new SupabaseExpenseDataSource(),
      ).create(groupId, data)
    } catch {
      return
    }
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
        currency={currency}
        initialPaidBy={currentMemberId}
        submitLabel="Add expense"
        onSubmit={handleSubmit}
      />
    </div>
  )
}
