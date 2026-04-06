import { Link } from "react-router-dom"
import type { DbExpense, DbGroupMember } from "@/lib/types"
import ExpenseItemView from "./ExpenseItemView"

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
    return <p className="text-muted-foreground text-sm">No expenses yet</p>
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-semibold text-lg">Expenses</h2>

      {expenses.map((expense) => (
        <Link
          key={expense.id}
          to={`/groups/${inviteToken}/edit-expense/${expense.id}`}
          className="flex flex-col gap-1 rounded-lg border p-3 transition-colors hover:bg-muted"
        >
          <ExpenseItemView
            expense={expense}
            currency={currency}
            getMemberName={getMemberName}
          />
        </Link>
      ))}
    </div>
  )
}
