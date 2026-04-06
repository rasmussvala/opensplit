import type { DbExpense } from "@/lib/types"
import { formatAmount } from "@/lib/utils"

interface ExpenseItemViewProps {
  expense: DbExpense
  currency: string
  getMemberName: (id: string) => string
}

export default function ExpenseItemView({
  expense,
  currency,
  getMemberName,
}: ExpenseItemViewProps) {
  const date = new Date(expense.created_at).toLocaleDateString()

  return (
    <>
      <div className="flex items-center justify-between">
        <span className="font-medium">{expense.description}</span>
        <span className="font-medium">
          {formatAmount(currency, Number(expense.amount))}
        </span>
      </div>
      <span className="text-muted-foreground text-xs">{date}</span>
      <div className="flex items-center justify-between text-muted-foreground text-xs">
        <span>Split: {expense.split_among.map(getMemberName).join(", ")}</span>
        <span>Paid by {getMemberName(expense.paid_by)}</span>
      </div>
    </>
  )
}
