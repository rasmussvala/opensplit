import { describe, expect, it } from "vitest"
import { calculateBalances, type Expense, type Settlement } from "./balances"
import { simplifyDebts, suggestedSettlements } from "./simplify"

describe("simplifyDebts", () => {
  it("returns no transactions when all balances are zero", () => {
    const transactions = simplifyDebts({ alice: 0, bob: 0 })
    expect(transactions).toEqual([])
  })

  it("returns a single transaction for two people", () => {
    const transactions = simplifyDebts({ alice: 50, bob: -50 })
    expect(transactions).toEqual([{ from: "bob", to: "alice", amount: 50 }])
  })

  it("simplifies three-person debts into minimum transactions", () => {
    // alice: +25, bob: -5, charlie: -20
    const transactions = simplifyDebts({ alice: 25, bob: -5, charlie: -20 })

    // Greedy: largest debtor (charlie: -20) pays largest creditor (alice: +25)
    //   charlie → alice: 20, alice now +5
    // Then: bob (-5) pays alice (+5)
    //   bob → alice: 5
    expect(transactions).toEqual([
      { from: "charlie", to: "alice", amount: 20 },
      { from: "bob", to: "alice", amount: 5 },
    ])
  })

  it("returns empty when given empty balances", () => {
    const transactions = simplifyDebts({})
    expect(transactions).toEqual([])
  })

  it("handles four people with multiple creditors and debtors", () => {
    // alice: +30, bob: +10, charlie: -25, dave: -15
    const transactions = simplifyDebts({
      alice: 30,
      bob: 10,
      charlie: -25,
      dave: -15,
    })

    // Greedy:
    //   charlie (-25) → alice (+30): 25, alice now +5
    //   dave (-15) → alice (+5): 5, alice done, dave now -10
    //   dave (-10) → bob (+10): 10
    expect(transactions).toEqual([
      { from: "charlie", to: "alice", amount: 25 },
      { from: "dave", to: "alice", amount: 5 },
      { from: "dave", to: "bob", amount: 10 },
    ])
  })

  it("handles a single person paying for everyone", () => {
    // alice paid everything, 4-way split
    // alice: +75, bob: -25, charlie: -25, dave: -25
    const transactions = simplifyDebts({
      alice: 75,
      bob: -25,
      charlie: -25,
      dave: -25,
    })

    expect(transactions).toHaveLength(3)
    for (const transaction of transactions) {
      expect(transaction.to).toBe("alice")
      expect(transaction.amount).toBe(25)
    }
  })

  it("handles rounding from uneven splits", () => {
    // 100 split 3 ways: each share is 33.333...
    // alice paid, so alice: +66.67, bob: -33.33, charlie: -33.33
    const balances = { alice: 66.67, bob: -33.33, charlie: -33.34 }
    const transactions = simplifyDebts(balances)

    // All debts should be settled, net flow should match balances
    const netFlow: Record<string, number> = {}
    for (const { from, to, amount } of transactions) {
      netFlow[from] = (netFlow[from] ?? 0) - amount
      netFlow[to] = (netFlow[to] ?? 0) + amount
    }

    for (const [name, balance] of Object.entries(balances)) {
      expect(netFlow[name]).toBeCloseTo(balance)
    }
  })

  it("filters out near-zero transactions from floating-point rounding", () => {
    // Balances that sum to zero but produce tiny residuals
    const balances = { alice: 33.34, bob: -16.67, charlie: -16.67 }
    const transactions = simplifyDebts(balances)

    for (const t of transactions) {
      expect(t.amount).toBeGreaterThanOrEqual(0.01)
    }
  })

  it("all transactions sum to zero (no money created or lost)", () => {
    const balances = { alice: 40, bob: -10, charlie: -15, dave: 5, eve: -20 }
    const transactions = simplifyDebts(balances)

    // Verify each person's net flow matches their original balance
    const netFlow: Record<string, number> = {}
    for (const { from, to, amount } of transactions) {
      netFlow[from] = (netFlow[from] ?? 0) - amount
      netFlow[to] = (netFlow[to] ?? 0) + amount
    }

    for (const [name, balance] of Object.entries(balances)) {
      if (balance !== 0) {
        expect(netFlow[name]).toBeCloseTo(balance)
      }
    }
  })
})

describe("suggestedSettlements", () => {
  const twoPersonExpense: Expense[] = [
    { paid_by: "alice", amount: 100, split_among: ["alice", "bob"] },
  ]

  it("equals the expense-only base plan when there are no settlements", () => {
    expect(suggestedSettlements(twoPersonExpense, [])).toEqual(
      simplifyDebts(calculateBalances(twoPersonExpense)),
    )
  })

  it("reduces only the paying pair's edge by the paid amount", () => {
    const settlements: Settlement[] = [{ from: "bob", to: "alice", amount: 20 }]
    expect(suggestedSettlements(twoPersonExpense, settlements)).toEqual([
      { from: "bob", to: "alice", amount: 30 },
    ])
  })

  it("removes an edge once it is fully paid", () => {
    const settlements: Settlement[] = [{ from: "bob", to: "alice", amount: 50 }]
    expect(suggestedSettlements(twoPersonExpense, settlements)).toEqual([])
  })

  it("sums cumulative payments between the same pair", () => {
    const settlements: Settlement[] = [
      { from: "bob", to: "alice", amount: 20 },
      { from: "bob", to: "alice", amount: 15 },
    ]
    expect(suggestedSettlements(twoPersonExpense, settlements)).toEqual([
      { from: "bob", to: "alice", amount: 15 },
    ])
  })

  it("nets opposite-direction payments between the same pair", () => {
    const settlements: Settlement[] = [
      { from: "bob", to: "alice", amount: 60 },
      { from: "alice", to: "bob", amount: 10 },
    ]
    expect(suggestedSettlements(twoPersonExpense, settlements)).toEqual([])
  })

  it("leaves unrelated pairs untouched when one pair pays", () => {
    const expenses: Expense[] = [
      { paid_by: "alice", amount: 100, split_among: ["alice", "bob"] },
      { paid_by: "carol", amount: 100, split_among: ["carol", "dave"] },
    ]
    const settlements: Settlement[] = [{ from: "bob", to: "alice", amount: 50 }]
    const result = suggestedSettlements(expenses, settlements)

    expect(result).toContainEqual({ from: "dave", to: "carol", amount: 50 })
    expect(result.some((t) => t.from === "bob")).toBe(false)
  })

  it("never emits amounts below one cent", () => {
    const expenses: Expense[] = [
      { paid_by: "alice", amount: 100, split_among: ["alice", "bob", "carol"] },
    ]
    for (const t of suggestedSettlements(expenses, [])) {
      expect(t.amount).toBeGreaterThanOrEqual(0.01)
    }
  })

  // Regression for GitHub issue #45: recording a payment between two members
  // must not change the suggested settlement for an unrelated member.
  it("does not change an unrelated member's suggestion after a partial payment (#45)", () => {
    // Net balances: john +508.05, arvid +156.05,
    //               johan -401.95, rasmus -154.95, david -107.20
    // Greedy base plan:
    //   johan  -> john  401.95
    //   rasmus -> john  106.10
    //   rasmus -> arvid  48.85
    //   david  -> arvid 107.20
    const expenses: Expense[] = [
      {
        paid_by: "john",
        amount: 508.05,
        split_among: ["johan", "rasmus"],
        split_overrides: {
          mode: "amount",
          values: { johan: 401.95, rasmus: 106.1 },
        },
      },
      {
        paid_by: "arvid",
        amount: 156.05,
        split_among: ["rasmus", "david"],
        split_overrides: {
          mode: "amount",
          values: { rasmus: 48.85, david: 107.2 },
        },
      },
    ]

    const basePlan = simplifyDebts(calculateBalances(expenses))
    const baseDavid = basePlan.filter((t) => t.from === "david")
    expect(baseDavid).toEqual([{ from: "david", to: "arvid", amount: 107.2 }])

    // Rasmus pays the suggested rasmus -> arvid edge in full.
    const settlements: Settlement[] = [
      { from: "rasmus", to: "arvid", amount: 48.85 },
    ]
    const result = suggestedSettlements(expenses, settlements)

    // David's suggestion is byte-for-byte unchanged (the bug split it into
    // `david -> john 106.10` + `david -> arvid 1.10`).
    expect(result.filter((t) => t.from === "david")).toEqual(baseDavid)

    // The paid edge is gone; the other unrelated edges are untouched.
    expect(result.some((t) => t.from === "rasmus" && t.to === "arvid")).toBe(
      false,
    )
    expect(result).toContainEqual({
      from: "johan",
      to: "john",
      amount: 401.95,
    })
    expect(result).toContainEqual({
      from: "rasmus",
      to: "john",
      amount: 106.1,
    })
  })
})
