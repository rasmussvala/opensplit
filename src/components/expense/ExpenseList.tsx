import { Link } from "react-router-dom"
import type { DbExpense, DbGroupMember } from "@/lib/types"
import ExpenseItem from "./ExpenseItem"

interface ExpenseListProps {
  expenses: DbExpense[]
  members: DbGroupMember[]
  currency: string
  inviteToken: string
}

export default function ExpenseList({
  expenses,
  members,
  currency,
  inviteToken,
}: ExpenseListProps) {
  const memberNames = new Map(members.map((m) => [m.id, m.guest_name]))

  function getMemberName(id: string): string {
    return memberNames.get(id) ?? "Unknown"
  }

  if (expenses.length === 0) {
    return (
      <div>
        <h2 className="mb-2 font-semibold text-sm">Expenses</h2>
        <p className="rounded-xl border border-border/70 border-dashed bg-card/20 p-4 text-center text-muted-foreground text-sm">
          No expenses yet
        </p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-2 font-semibold text-sm">Expenses</h2>
      <div className="flex flex-col gap-2">
        {expenses.map((expense) => (
          <Link
            key={expense.id}
            to={`/groups/${inviteToken}/edit-expense/${expense.id}`}
            className="group relative block overflow-hidden rounded-xl border border-border/70 bg-card/40 p-3 transition-colors hover:border-border hover:bg-card/70"
          >
            <ExpenseItem
              expense={expense}
              currency={currency}
              getMemberName={getMemberName}
            />
          </Link>
        ))}
      </div>
    </div>
  )
}
