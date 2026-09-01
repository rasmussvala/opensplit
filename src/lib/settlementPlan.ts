import type {
  Expense,
  Settlement,
} from "@/application/groups/loadGroupSnapshot"
import { calculateBalances } from "./balances"
import { simplifyDebts } from "./simplify"
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
