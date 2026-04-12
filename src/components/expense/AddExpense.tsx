import { useState } from "react"
import { supabase } from "@/lib/supabase"
import type { DbGroupMember } from "@/lib/types"
import ExpenseForm, { type ExpenseFormData } from "./ExpenseForm"

interface AddExpenseProps {
  groupId: string
  members: DbGroupMember[]
  currency: string
  onAdded: () => void
}

export default function AddExpense({
  groupId,
  members,
  currency,
  onAdded,
}: AddExpenseProps) {
  const [resetKey, setResetKey] = useState(0)

  async function handleSubmit(data: ExpenseFormData) {
    const { error } = await supabase.from("expenses").insert({
      group_id: groupId,
      description: data.description,
      amount: data.amount,
      paid_by: data.paidBy,
      split_among: data.splitAmong,
    })

    if (error) return

    setResetKey((k) => k + 1)
    onAdded()
  }

  return (
    <ExpenseForm
      key={resetKey}
      members={members}
      currency={currency}
      submitLabel="Add expense"
      onSubmit={handleSubmit}
    />
  )
}
