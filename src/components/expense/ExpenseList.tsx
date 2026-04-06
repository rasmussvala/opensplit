import { useState } from "react"
import { supabase } from "@/lib/supabase"
import type { DbExpense, DbGroupMember } from "@/lib/types"
import type { ExpenseEditData } from "./ExpenseItemEdit"
import ExpenseItemEdit from "./ExpenseItemEdit"
import ExpenseItemView from "./ExpenseItemView"

interface ExpenseListProps {
  expenses: DbExpense[]
  members: DbGroupMember[]
  currency: string
  onChanged: () => void
}

export default function ExpenseList({
  expenses,
  members,
  currency,
  onChanged,
}: ExpenseListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)

  const memberNames = new Map(members.map((m) => [m.id, m.guest_name]))

  function getMemberName(id: string): string {
    return memberNames.get(id) ?? "Unknown"
  }

  async function saveEdit(expenseId: string, data: ExpenseEditData) {
    const { error } = await supabase
      .from("expenses")
      .update({
        description: data.description,
        amount: data.amount,
        paid_by: data.paidBy,
        split_among: data.splitAmong,
      })
      .eq("id", expenseId)

    if (error) return

    setEditingId(null)
    onChanged()
  }

  async function deleteExpense(id: string) {
    const { error } = await supabase.from("expenses").delete().eq("id", id)
    if (error) return
    onChanged()
  }

  if (expenses.length === 0) {
    return <p className="text-muted-foreground text-sm">No expenses yet</p>
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-semibold text-lg">Expenses</h2>

      {expenses.map((expense) => (
        <div
          key={expense.id}
          className="flex flex-col gap-2 rounded-lg border p-3"
        >
          {editingId === expense.id ? (
            <ExpenseItemEdit
              expense={expense}
              members={members}
              onSave={(data) => saveEdit(expense.id, data)}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <ExpenseItemView
              expense={expense}
              currency={currency}
              getMemberName={getMemberName}
              onEdit={() => setEditingId(expense.id)}
              onDelete={() => deleteExpense(expense.id)}
            />
          )}
        </div>
      ))}
    </div>
  )
}
