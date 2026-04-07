import { describe, expect, it } from "vitest"
import { simplifyDebts } from "./simplify"

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
