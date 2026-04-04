interface Transaction {
  from: string
  to: string
  amount: number
}

export function simplifyDebts(balances: Record<string, number>): Transaction[] {
  const creditors: { name: string; amount: number }[] = []
  const debtors: { name: string; amount: number }[] = []

  for (const [name, balance] of Object.entries(balances)) {
    if (balance > 0) creditors.push({ name, amount: balance })
    else if (balance < 0) debtors.push({ name, amount: -balance })
  }

  creditors.sort((a, b) => b.amount - a.amount)
  debtors.sort((a, b) => b.amount - a.amount)

  const transactions: Transaction[] = []

  let i = 0
  let j = 0

  while (i < debtors.length && j < creditors.length) {
    const settled = Math.min(debtors[i].amount, creditors[j].amount)
    transactions.push({ from: debtors[i].name, to: creditors[j].name, amount: settled })

    debtors[i].amount -= settled
    creditors[j].amount -= settled

    if (debtors[i].amount === 0) i++
    if (creditors[j].amount === 0) j++
  }

  return transactions
}
