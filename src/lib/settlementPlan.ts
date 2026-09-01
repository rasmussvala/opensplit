import type {
  Expense,
  Settlement,
} from "@/application/groups/loadGroupSnapshot"
import { round2 } from "./utils"

export interface Transaction {
  from: string
  to: string
  amount: number
}

export interface SettlementPlan {
  balances: Record<string, number>
  suggestions: Transaction[]
}

export function calculateSettlementPlan(
  expenses: Expense[],
  settlements: Settlement[],
): SettlementPlan {
  const balances = calculateBalances(expenses, settlements)
  const basePlan = simplifyDebts(calculateBalances(expenses))
  const paid = new Map<string, number>()
  for (const settlement of settlements) {
    const key = `${settlement.from}|${settlement.to}`
    paid.set(key, (paid.get(key) ?? 0) + settlement.amount)
  }

  const adjustedPlan = basePlan
    .map((transaction) => {
      const forward = paid.get(`${transaction.from}|${transaction.to}`) ?? 0
      const reverse = paid.get(`${transaction.to}|${transaction.from}`) ?? 0
      return {
        from: transaction.from,
        to: transaction.to,
        amount: round2(transaction.amount - forward + reverse),
      }
    })
    .filter((transaction) => Math.round(transaction.amount * 100) > 0)

  const representedBalances: Record<string, number> = {}
  for (const transaction of adjustedPlan) {
    representedBalances[transaction.from] = round2(
      (representedBalances[transaction.from] ?? 0) - transaction.amount,
    )
    representedBalances[transaction.to] = round2(
      (representedBalances[transaction.to] ?? 0) + transaction.amount,
    )
  }

  const matchesCurrentBalances = Object.keys(balances).every(
    (memberId) =>
      round2(representedBalances[memberId] ?? 0) === balances[memberId],
  )

  return {
    balances,
    suggestions: matchesCurrentBalances
      ? adjustedPlan
      : simplifyDebts(balances),
  }
}

function calculateBalances(
  expenses: Expense[],
  settlements: Settlement[] = [],
): Record<string, number> {
  const balances: Record<string, number> = {}
  for (const expense of expenses) {
    const shares = computeShares(expense)
    balances[expense.paidBy] = (balances[expense.paidBy] ?? 0) + expense.amount
    for (const [memberId, share] of Object.entries(shares)) {
      balances[memberId] = (balances[memberId] ?? 0) - share
    }
  }
  for (const settlement of settlements) {
    balances[settlement.from] =
      (balances[settlement.from] ?? 0) + settlement.amount
    balances[settlement.to] = (balances[settlement.to] ?? 0) - settlement.amount
  }
  for (const key of Object.keys(balances)) balances[key] = round2(balances[key])
  return balances
}

function computeShares(expense: Expense): Record<string, number> {
  const shares: Record<string, number> = {}
  for (const memberId of expense.splitAmong) shares[memberId] = 0
  const overrides = expense.splitOverrides?.values
    ? Object.entries(expense.splitOverrides.values).filter(([id]) =>
        expense.splitAmong.includes(id),
      )
    : []
  const overrideIds = new Set(overrides.map(([id]) => id))
  for (const [memberId, value] of overrides) {
    shares[memberId] = round2(
      expense.splitOverrides?.mode === "percent"
        ? (value / 100) * expense.amount
        : value,
    )
  }
  const remainderMembers = expense.splitAmong.filter(
    (id) => !overrideIds.has(id),
  )
  const remainder =
    expense.amount - overrides.reduce((sum, [id]) => sum + shares[id], 0)
  if (remainderMembers.length > 0 && remainder > 0) {
    const share = round2(remainder / remainderMembers.length)
    for (const memberId of remainderMembers) shares[memberId] = share
  }
  const drift = round2(
    expense.amount -
      Object.values(shares).reduce((sum, share) => sum + share, 0),
  )
  if (drift !== 0)
    shares[expense.paidBy] = round2((shares[expense.paidBy] ?? 0) + drift)
  return shares
}

function simplifyDebts(balances: Record<string, number>): Transaction[] {
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
    const amount = Math.min(debtors[i].amount, creditors[j].amount)
    transactions.push({
      from: debtors[i].name,
      to: creditors[j].name,
      amount: round2(amount),
    })
    debtors[i].amount = round2(debtors[i].amount - amount)
    creditors[j].amount = round2(creditors[j].amount - amount)
    if (debtors[i].amount === 0) i++
    if (creditors[j].amount === 0) j++
  }
  return transactions.filter(
    (transaction) => Math.round(transaction.amount * 100) > 0,
  )
}
