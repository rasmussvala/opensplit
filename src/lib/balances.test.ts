import { describe, expect, it } from "vitest"
import { calculateBalances } from "./balances"

describe("calculateBalances", () => {
  it("returns empty balances when there are no expenses", () => {
    const balances = calculateBalances([])
    expect(balances).toEqual({})
  })

  it("calculates balances for a single expense split between two people", () => {
    const balances = calculateBalances([
      {
        paid_by: "alice",
        amount: 100,
        split_among: ["alice", "bob"],
      },
    ])

    // Alice paid 100, owes 50 → net +50
    // Bob paid 0, owes 50 → net -50
    expect(balances).toEqual({
      alice: 50,
      bob: -50,
    })
  })

  it("calculates balances for multiple expenses", () => {
    const balances = calculateBalances([
      {
        paid_by: "alice",
        amount: 60,
        split_among: ["alice", "bob", "charlie"],
      },
      {
        paid_by: "bob",
        amount: 30,
        split_among: ["alice", "bob"],
      },
    ])

    // Expense 1: Alice pays 60 split 3 ways (20 each)
    //   alice: +60 - 20 = +40
    //   bob:         -20
    //   charlie:     -20
    //
    // Expense 2: Bob pays 30 split 2 ways (15 each)
    //   alice:       -15
    //   bob:   +30 - 15 = +15
    //
    // Totals: alice: +25, bob: -5, charlie: -20
    expect(balances).toEqual({
      alice: 25,
      bob: -5,
      charlie: -20,
    })
  })

  it("handles uneven splits without floating point errors", () => {
    const balances = calculateBalances([
      {
        paid_by: "alice",
        amount: 100,
        split_among: ["alice", "bob", "charlie"],
      },
    ])

    // 100 / 3 = 33.333...
    // alice: +100 - 33.33 = +66.67
    // bob: -33.33
    // charlie: -33.33
    // Sum should be 0 (no money created or lost)
    const sum = Object.values(balances).reduce((a, b) => a + b, 0)
    expect(sum).toBeCloseTo(0)
  })

  it("returns zero balances when everyone is even", () => {
    const balances = calculateBalances([
      {
        paid_by: "alice",
        amount: 50,
        split_among: ["alice", "bob"],
      },
      {
        paid_by: "bob",
        amount: 50,
        split_among: ["alice", "bob"],
      },
    ])

    expect(balances).toEqual({
      alice: 0,
      bob: 0,
    })
  })
})
