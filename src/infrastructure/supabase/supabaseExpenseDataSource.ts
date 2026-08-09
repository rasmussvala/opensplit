import type {
  ExpenseDataSource,
  ExpenseInput,
} from "@/application/expenses/manageExpenses"
import { supabase } from "@/lib/supabase"

export class SupabaseExpenseDataSource implements ExpenseDataSource {
  async create(groupId: string, input: ExpenseInput): Promise<void> {
    const { error } = await supabase.from("expenses").insert({
      group_id: groupId,
      description: input.description,
      amount: input.amount,
      paid_by: input.paidBy,
      split_among: input.splitAmong,
      split_overrides: input.splitOverrides,
    })
    if (error) throw new Error(`Failed to create expense: ${error.message}`)
  }

  async update(expenseId: string, input: ExpenseInput): Promise<void> {
    const { error } = await supabase
      .from("expenses")
      .update({
        description: input.description,
        amount: input.amount,
        paid_by: input.paidBy,
        split_among: input.splitAmong,
        split_overrides: input.splitOverrides,
      })
      .eq("id", expenseId)
    if (error) throw new Error(`Failed to update expense: ${error.message}`)
  }

  async delete(expenseId: string): Promise<void> {
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", expenseId)
    if (error) throw new Error(`Failed to delete expense: ${error.message}`)
  }
}
