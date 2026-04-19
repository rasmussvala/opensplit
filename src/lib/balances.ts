import type { SplitOverrides } from "./types"

export interface Expense {
  paid_by: string
  amount: number
  split_among: string[]
  split_overrides?: SplitOverrides | null
}

export interface Settlement {
  from: string
  to: string
  amount: number
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

export function computeShares(expense: Expense): Record<string, number> {
  const { amount, split_among, split_overrides, paid_by } = expense
  const shares: Record<string, number> = {}

  for (const memberId of split_among) {
    shares[memberId] = 0
  }

  const overrideEntries =
    split_overrides?.values && Object.keys(split_overrides.values).length > 0
      ? Object.entries(split_overrides.values).filter(([memberId]) =>
          split_among.includes(memberId),
        )
      : []

  const overrideIds = new Set(overrideEntries.map(([id]) => id))

  for (const [memberId, value] of overrideEntries) {
    const share =
      split_overrides?.mode === "percent" ? (value / 100) * amount : value
    shares[memberId] = round2(share)
  }

  const remainderMembers = split_among.filter((id) => !overrideIds.has(id))
  const overrideSum = overrideEntries.reduce((sum, [id]) => sum + shares[id], 0)
  const remainder = amount - overrideSum

  if (remainderMembers.length > 0 && remainder > 0) {
    const perMember = round2(remainder / remainderMembers.length)
    for (const memberId of remainderMembers) {
      shares[memberId] = perMember
    }
  }

  const totalShares = Object.values(shares).reduce((sum, s) => sum + s, 0)
  const drift = round2(amount - totalShares)

  if (drift !== 0) {
    if (!(paid_by in shares)) {
      shares[paid_by] = 0
    }
    shares[paid_by] = round2(shares[paid_by] + drift)
  }

  return shares
}

export function calculateBalances(
  expenses: Expense[],
  settlements: Settlement[] = [],
): Record<string, number> {
  const balances: Record<string, number> = {}

  for (const expense of expenses) {
    const shares = computeShares(expense)

    balances[expense.paid_by] =
      (balances[expense.paid_by] ?? 0) + expense.amount

    for (const [memberId, share] of Object.entries(shares)) {
      balances[memberId] = (balances[memberId] ?? 0) - share
    }
  }

  for (const settlement of settlements) {
    balances[settlement.from] =
      (balances[settlement.from] ?? 0) + settlement.amount
    balances[settlement.to] = (balances[settlement.to] ?? 0) - settlement.amount
  }

  for (const key of Object.keys(balances)) {
    balances[key] = round2(balances[key])
  }

  return balances
}
