import type {
  Expense,
  GroupSnapshot,
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

export type SettlementValidationCommand = {
  from: string
  to: string
  amount: number
}

export type SettlementValidationResult =
  | { status: "valid"; amount: number }
  | { status: "invalid-amount" }
  | { status: "same-member" }
  | { status: "no-outstanding" }
  | { status: "exceeds-outstanding" }

export function calculateExpenseShares(
  expense: Expense,
): Record<string, number> {
  const shares: Record<string, number> = {}
  for (const memberId of expense.splitAmong) shares[memberId] = 0
  const overrides = expense.splitOverrides?.values
    ? Object.entries(expense.splitOverrides.values).filter(([id]) =>
        expense.splitAmong.includes(id),
      )
    : []
  const overridden = new Set(overrides.map(([id]) => id))
  for (const [id, value] of overrides)
    shares[id] = round2(
      expense.splitOverrides?.mode === "percent"
        ? (value / 100) * expense.amount
        : value,
    )
  const remainderMembers = expense.splitAmong.filter(
    (id) => !overridden.has(id),
  )
  const remainder =
    expense.amount - overrides.reduce((sum, [id]) => sum + shares[id], 0)
  if (remainderMembers.length > 0 && remainder > 0) {
    const share = round2(remainder / remainderMembers.length)
    for (const id of remainderMembers) shares[id] = share
  }
  const drift = round2(
    expense.amount -
      Object.values(shares).reduce((sum, value) => sum + value, 0),
  )
  if (drift !== 0)
    shares[expense.paidBy] = round2((shares[expense.paidBy] ?? 0) + drift)
  return shares
}

function calculateBalances(
  expenses: Expense[],
  settlements: Settlement[] = [],
) {
  const balances: Record<string, number> = {}
  for (const expense of expenses) {
    const shares = calculateExpenseShares(expense)
    balances[expense.paidBy] = (balances[expense.paidBy] ?? 0) + expense.amount
    for (const [id, share] of Object.entries(shares))
      balances[id] = (balances[id] ?? 0) - share
  }
  for (const settlement of settlements) {
    balances[settlement.from] =
      (balances[settlement.from] ?? 0) + settlement.amount
    balances[settlement.to] = (balances[settlement.to] ?? 0) - settlement.amount
  }
  for (const id of Object.keys(balances)) balances[id] = round2(balances[id])
  return balances
}

function simplifyDebts(balances: Record<string, number>): Transaction[] {
  const creditors = Object.entries(balances)
    .filter(([, amount]) => amount > 0)
    .map(([name, amount]) => ({ name, amount }))
  const debtors = Object.entries(balances)
    .filter(([, amount]) => amount < 0)
    .map(([name, amount]) => ({ name, amount: -amount }))
  creditors.sort((a, b) => b.amount - a.amount)
  debtors.sort((a, b) => b.amount - a.amount)
  const result: Transaction[] = []
  let i = 0
  let j = 0
  while (i < debtors.length && j < creditors.length) {
    const amount = round2(Math.min(debtors[i].amount, creditors[j].amount))
    result.push({ from: debtors[i].name, to: creditors[j].name, amount })
    debtors[i].amount = round2(debtors[i].amount - amount)
    creditors[j].amount = round2(creditors[j].amount - amount)
    if (debtors[i].amount === 0) i++
    if (creditors[j].amount === 0) j++
  }
  return result.filter(
    (transaction) => Math.round(transaction.amount * 100) > 0,
  )
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

export function planSettlement(
  snapshot: Pick<GroupSnapshot, "expenses" | "settlements">,
): SettlementPlan {
  return calculateSettlementPlan(snapshot.expenses, snapshot.settlements)
}

export function validateSettlement(
  snapshot: Pick<GroupSnapshot, "expenses" | "settlements">,
  command: SettlementValidationCommand,
): SettlementValidationResult {
  const amount = round2(command.amount)
  if (!Number.isFinite(command.amount) || amount <= 0)
    return { status: "invalid-amount" }
  if (command.from === command.to) return { status: "same-member" }

  const suggestion = planSettlement(snapshot).suggestions.find(
    (transaction) =>
      transaction.from === command.from && transaction.to === command.to,
  )
  if (!suggestion) return { status: "no-outstanding" }
  if (amount > suggestion.amount) return { status: "exceeds-outstanding" }
  return { status: "valid", amount }
}
