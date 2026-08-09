import {
  type Expense,
  type GroupDataSource,
  loadGroupSnapshot,
  type Member,
} from "@/application/groups/loadGroupSnapshot"
import type { SplitOverrides } from "@/lib/types"

export interface ExpenseInput {
  description: string
  amount: number
  paidBy: string
  splitAmong: string[]
  splitOverrides: SplitOverrides | null
}

export interface ExpenseDataSource {
  create(groupId: string, input: ExpenseInput): Promise<void>
  update(expenseId: string, input: ExpenseInput): Promise<void>
  delete(expenseId: string): Promise<void>
}

export type ExpenseEditingContext = {
  expense: Expense
  members: Member[]
  currency: string
}
export type ExpenseCreationContext = Omit<ExpenseEditingContext, "expense"> & {
  groupId: string
  currentMemberId: string
}

export function manageExpenses(
  groups: GroupDataSource,
  expenses: ExpenseDataSource,
) {
  const loadSnapshot = loadGroupSnapshot(groups)

  return {
    async loadContext(
      inviteToken: string,
      userId: string,
      expenseId?: string,
    ): Promise<ExpenseEditingContext | null> {
      const result = await loadSnapshot.execute({ inviteToken, userId })
      if (result.status !== "member") return null
      const expense = result.snapshot.expenses.find(
        (candidate) => candidate.id === expenseId,
      )
      if (!expense) return null
      return {
        expense,
        members: result.snapshot.members,
        currency: result.snapshot.group.currency,
      }
    },
    async loadCreateContext(
      inviteToken: string,
      userId: string,
    ): Promise<ExpenseCreationContext | null> {
      const result = await loadSnapshot.execute({ inviteToken, userId })
      if (result.status !== "member") return null
      return {
        groupId: result.snapshot.group.id,
        members: result.snapshot.members,
        currency: result.snapshot.group.currency,
        currentMemberId: result.snapshot.currentMember.id,
      }
    },
    create: expenses.create.bind(expenses),
    update: expenses.update.bind(expenses),
    delete: expenses.delete.bind(expenses),
  }
}
