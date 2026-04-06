import { useState } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import type { DbExpense, DbGroupMember } from "@/lib/types"
import { formatAmount } from "@/lib/utils"

interface ExpenseListProps {
  expenses: DbExpense[]
  members: DbGroupMember[]
  currency: string
  onChanged: () => void
}

interface EditState {
  expenseId: string
  description: string
  amount: string
  paidBy: string
  splitAmong: string[]
}

export default function ExpenseList({
  expenses,
  members,
  currency,
  onChanged,
}: ExpenseListProps) {
  const [editing, setEditing] = useState<EditState | null>(null)

  const memberNames = new Map(members.map((m) => [m.id, m.guest_name]))

  function getMemberName(id: string): string {
    return memberNames.get(id) ?? "Unknown"
  }

  function startEdit(expense: DbExpense) {
    setEditing({
      expenseId: expense.id,
      description: expense.description,
      amount: String(Number(expense.amount)),
      paidBy: expense.paid_by,
      splitAmong: [...expense.split_among],
    })
  }

  function toggleEditMember(memberId: string) {
    if (!editing) return
    setEditing((prev) => {
      if (!prev) return prev
      const splitAmong = prev.splitAmong.includes(memberId)
        ? prev.splitAmong.filter((id) => id !== memberId)
        : [...prev.splitAmong, memberId]
      return { ...prev, splitAmong }
    })
  }

  async function saveEdit() {
    if (!editing) return
    const parsedAmount = Number(editing.amount)
    if (
      !editing.description.trim() ||
      !parsedAmount ||
      editing.splitAmong.length === 0
    )
      return

    const { error } = await supabase
      .from("expenses")
      .update({
        description: editing.description.trim(),
        amount: parsedAmount,
        paid_by: editing.paidBy,
        split_among: editing.splitAmong,
      })
      .eq("id", editing.expenseId)

    if (error) return

    setEditing(null)
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
          {editing?.expenseId === expense.id ? (
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={editing.description}
                onChange={(e) =>
                  setEditing((prev) =>
                    prev ? { ...prev, description: e.target.value } : prev,
                  )
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              />
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={editing.amount}
                onChange={(e) =>
                  setEditing((prev) =>
                    prev ? { ...prev, amount: e.target.value } : prev,
                  )
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              />
              <select
                value={editing.paidBy}
                onChange={(e) =>
                  setEditing((prev) =>
                    prev ? { ...prev, paidBy: e.target.value } : prev,
                  )
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.guest_name}
                  </option>
                ))}
              </select>
              <fieldset className="flex flex-col gap-1">
                <legend className="text-sm font-medium">Split among</legend>
                {members.map((m) => (
                  <label key={m.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={editing.splitAmong.includes(m.id)}
                      onChange={() => toggleEditMember(m.id)}
                      className="h-4 w-4 rounded border border-primary"
                    />
                    <span className="text-sm">{m.guest_name}</span>
                  </label>
                ))}
              </fieldset>
              <div className="flex gap-2">
                <Button size="sm" onClick={saveEdit}>
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
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
                <span>
                  Split: {expense.split_among.map(getMemberName).join(", ")}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => startEdit(expense)}
                >
                  Edit
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => deleteExpense(expense.id)}
                >
                  Delete
                </Button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}
