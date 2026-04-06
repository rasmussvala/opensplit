import { useState } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import type { DbGroupMember } from "@/lib/types"

interface AddExpenseProps {
  groupId: string
  members: DbGroupMember[]
  onAdded: () => void
}

export default function AddExpense({
  groupId,
  members,
  onAdded,
}: AddExpenseProps) {
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [paidBy, setPaidBy] = useState(members[0]?.id ?? "")
  const [splitAmong, setSplitAmong] = useState<string[]>(
    members.map((m) => m.id),
  )

  const checkedCount = splitAmong.length

  function getSplitPercentage(): string {
    if (checkedCount === 0) return "0%"
    const pct = (100 / checkedCount).toFixed(1)
    return pct.endsWith(".0") ? `${Number.parseInt(pct, 10)}%` : `${pct}%`
  }

  function toggleMember(memberId: string) {
    setSplitAmong((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId],
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const parsedAmount = Number(amount)
    if (!description.trim() || !parsedAmount || splitAmong.length === 0) return

    const { error } = await supabase.from("expenses").insert({
      group_id: groupId,
      description: description.trim(),
      amount: parsedAmount,
      paid_by: paidBy,
      split_among: splitAmong,
    })

    if (error) return

    setDescription("")
    setAmount("")
    setPaidBy(members[0]?.id ?? "")
    setSplitAmong(members.map((m) => m.id))
    onAdded()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <h2 className="font-semibold text-lg">Add expense</h2>

      <div className="flex flex-col gap-1">
        <label htmlFor="expense-description" className="text-sm font-medium">
          Description
        </label>
        <input
          id="expense-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What was it for?"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="expense-amount" className="text-sm font-medium">
          Amount
        </label>
        <input
          id="expense-amount"
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="expense-paid-by" className="text-sm font-medium">
          Who paid
        </label>
        <select
          id="expense-paid-by"
          value={paidBy}
          onChange={(e) => setPaidBy(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.guest_name}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">Split among</legend>
        {members.map((m) => (
          <label key={m.id} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                aria-label={m.guest_name}
                checked={splitAmong.includes(m.id)}
                onChange={() => toggleMember(m.id)}
                className="h-4 w-4 rounded border border-primary"
              />
              <span className="text-sm">{m.guest_name}</span>
            </div>
            {splitAmong.includes(m.id) && (
              <span className="text-muted-foreground text-xs">
                {getSplitPercentage()}
              </span>
            )}
          </label>
        ))}
      </fieldset>

      <Button type="submit">Add expense</Button>
    </form>
  )
}
