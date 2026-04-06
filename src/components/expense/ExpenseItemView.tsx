import { Button } from "@/components/ui/button"
import type { DbExpense } from "@/lib/types"
import { formatAmount } from "@/lib/utils"

interface ExpenseItemViewProps {
  expense: DbExpense
  currency: string
  getMemberName: (id: string) => string
  onEdit: () => void
  onDelete: () => void
}

export default function ExpenseItemView({
  expense,
  currency,
  getMemberName,
  onEdit,
  onDelete,
}: ExpenseItemViewProps) {
  return (
    <>
      <div className="flex items-center justify-between">
        <span className="font-medium">{expense.description}</span>
        <span className="font-medium">
          {formatAmount(currency, Number(expense.amount))}
        </span>
      </div>
      <div className="text-muted-foreground text-xs">
        <span>Paid by {getMemberName(expense.paid_by)}</span>
        <span className="mx-1">&middot;</span>
        <span>Split: {expense.split_among.map(getMemberName).join(", ")}</span>
      </div>
      <div className="flex gap-2">
        <Button size="xs" variant="outline" onClick={onEdit}>
          Edit
        </Button>
        <Button size="xs" variant="outline" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </>
  )
}
