interface Expense {
  paid_by: string
  amount: number
  split_among: string[]
}

interface Settlement {
  from: string
  to: string
  amount: number
}

export function calculateBalances(
  expenses: Expense[],
  settlements: Settlement[] = [],
): Record<string, number> {
  const balances: Record<string, number> = {}

  for (const expense of expenses) {
    const share = expense.amount / expense.split_among.length

    balances[expense.paid_by] =
      (balances[expense.paid_by] ?? 0) + expense.amount

    for (const member of expense.split_among) {
      balances[member] = (balances[member] ?? 0) - share
    }
  }

  for (const settlement of settlements) {
    balances[settlement.from] =
      (balances[settlement.from] ?? 0) + settlement.amount
    balances[settlement.to] = (balances[settlement.to] ?? 0) - settlement.amount
  }

  return balances
}
