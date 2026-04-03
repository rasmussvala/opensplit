interface Expense {
  paid_by: string
  amount: number
  split_among: string[]
}

export function calculateBalances(expenses: Expense[]): Record<string, number> {
  const balances: Record<string, number> = {}

  for (const expense of expenses) {
    const share = expense.amount / expense.split_among.length

    balances[expense.paid_by] =
      (balances[expense.paid_by] ?? 0) + expense.amount

    for (const member of expense.split_among) {
      balances[member] = (balances[member] ?? 0) - share
    }
  }

  return balances
}
