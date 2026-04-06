import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { DbExpense, DbGroupMember } from "@/lib/types"

export interface ExpenseEditData {
  description: string
  amount: number
  paidBy: string
  splitAmong: string[]
}

interface ExpenseItemEditProps {
  expense: DbExpense
  members: DbGroupMember[]
  onSave: (data: ExpenseEditData) => void
  onCancel: () => void
}

export default function ExpenseItemEdit({
  expense,
  members,
  onSave,
  onCancel,
}: ExpenseItemEditProps) {
  const [description, setDescription] = useState(expense.description)
  const [amount, setAmount] = useState(String(Number(expense.amount)))
  const [paidBy, setPaidBy] = useState(expense.paid_by)
  const [splitAmong, setSplitAmong] = useState([...expense.split_among])

  function toggleMember(memberId: string) {
    setSplitAmong((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId],
    )
  }

  function handleSave() {
    const parsedAmount = Number(amount)
    if (!description.trim() || !parsedAmount || splitAmong.length === 0) return
    onSave({
      description: description.trim(),
      amount: parsedAmount,
      paidBy,
      splitAmong,
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
      />
      <input
        type="number"
        min="0.01"
        step="0.01"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
      />
      <select
        value={paidBy}
        onChange={(e) => setPaidBy(e.target.value)}
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
              checked={splitAmong.includes(m.id)}
              onChange={() => toggleMember(m.id)}
              className="h-4 w-4 rounded border border-primary"
            />
            <span className="text-sm">{m.guest_name}</span>
          </label>
        ))}
      </fieldset>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleSave}>
          Save
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
