import { describe, expect, it } from "vitest"
import { calculateBalances, computeShares, type Settlement } from "./balances"

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

    // 100 / 3 = 33.333... → rounded to 33.33
    // alice: +100 - 33.33 = +66.67
    // bob: -33.33
    // charlie: -33.33
    // Sum may be off by 1 cent due to rounding (100 can't split 3 ways evenly)
    const sum = Object.values(balances).reduce((a, b) => a + b, 0)
    expect(Math.round(Math.abs(sum) * 100) / 100).toBeLessThanOrEqual(0.01)
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

  it("subtracts settlements from balances", () => {
    const expenses = [
      {
        paid_by: "alice",
        amount: 100,
        split_among: ["alice", "bob"],
      },
    ]
    const settlements: Settlement[] = [{ from: "bob", to: "alice", amount: 50 }]

    const balances = calculateBalances(expenses, settlements)

    // alice: +50 from expense, -50 from settlement received = 0
    // bob: -50 from expense, +50 from settlement paid = 0
    expect(balances).toEqual({
      alice: 0,
      bob: 0,
    })
  })

  it("handles partial settlement", () => {
    const expenses = [
      {
        paid_by: "alice",
        amount: 100,
        split_among: ["alice", "bob"],
      },
    ]
    const settlements: Settlement[] = [{ from: "bob", to: "alice", amount: 20 }]

    const balances = calculateBalances(expenses, settlements)

    // alice: +50 - 20 = +30
    // bob: -50 + 20 = -30
    expect(balances).toEqual({
      alice: 30,
      bob: -30,
    })
  })

  it("handles multiple settlements across different members", () => {
    const expenses = [
      {
        paid_by: "alice",
        amount: 60,
        split_among: ["alice", "bob", "charlie"],
      },
    ]
    const settlements: Settlement[] = [
      { from: "bob", to: "alice", amount: 20 },
      { from: "charlie", to: "alice", amount: 20 },
    ]

    const balances = calculateBalances(expenses, settlements)

    expect(balances).toEqual({
      alice: 0,
      bob: 0,
      charlie: 0,
    })
  })

  it("handles settlements with no expenses", () => {
    const settlements: Settlement[] = [{ from: "bob", to: "alice", amount: 30 }]

    const balances = calculateBalances([], settlements)

    // bob paid alice 30 with no expenses — bob is owed 30
    expect(balances).toEqual({
      bob: 30,
      alice: -30,
    })
  })

  it("handles overpayment via settlement", () => {
    const expenses = [
      {
        paid_by: "alice",
        amount: 100,
        split_among: ["alice", "bob"],
      },
    ]
    const settlements: Settlement[] = [{ from: "bob", to: "alice", amount: 60 }]

    const balances = calculateBalances(expenses, settlements)

    // alice: +50 - 60 = -10 (now owes bob)
    // bob: -50 + 60 = +10
    expect(balances).toEqual({
      alice: -10,
      bob: 10,
    })
  })

  it("rounds balances to 2 decimal places to avoid floating-point dust", () => {
    const balances = calculateBalances([
      {
        paid_by: "alice",
        amount: 100,
        split_among: ["alice", "bob", "charlie"],
      },
    ])

    // 100/3 = 33.333... → each balance should be rounded to 2 decimals
    for (const balance of Object.values(balances)) {
      const decimals = balance.toString().split(".")[1]?.length ?? 0
      expect(decimals).toBeLessThanOrEqual(2)
    }
  })

  it("defaults to no settlements when omitted", () => {
    const balances = calculateBalances([
      {
        paid_by: "alice",
        amount: 100,
        split_among: ["alice", "bob"],
      },
    ])

    expect(balances).toEqual({
      alice: 50,
      bob: -50,
    })
  })

  it("treats null split_overrides as equal split (regression guard)", () => {
    const balances = calculateBalances([
      {
        paid_by: "alice",
        amount: 100,
        split_among: ["alice", "bob"],
        split_overrides: null,
      },
    ])

    expect(balances).toEqual({
      alice: 50,
      bob: -50,
    })
  })

  it("applies a single percent override with the rest split equally", () => {
    const balances = calculateBalances([
      {
        paid_by: "alice",
        amount: 100,
        split_among: ["alice", "bob", "charlie", "dave"],
        split_overrides: {
          mode: "percent",
          values: { bob: 40 },
        },
      },
    ])

    // bob owes 40% = 40
    // remainder 60 split across alice+charlie+dave → 20 each
    // alice: +100 - 20 = +80
    expect(balances).toEqual({
      alice: 80,
      bob: -40,
      charlie: -20,
      dave: -20,
    })
  })

  it("applies a single amount override with the rest split equally", () => {
    const balances = calculateBalances([
      {
        paid_by: "alice",
        amount: 500,
        split_among: ["alice", "bob", "charlie"],
        split_overrides: {
          mode: "amount",
          values: { bob: 300 },
        },
      },
    ])

    // bob owes 300, remainder 200 split across alice+charlie → 100 each
    // alice: +500 - 100 = +400
    expect(balances).toEqual({
      alice: 400,
      bob: -300,
      charlie: -100,
    })
  })

  it("handles every member overridden to an exact sum", () => {
    const balances = calculateBalances([
      {
        paid_by: "alice",
        amount: 100,
        split_among: ["alice", "bob", "charlie"],
        split_overrides: {
          mode: "amount",
          values: { alice: 50, bob: 30, charlie: 20 },
        },
      },
    ])

    // alice: +100 - 50 = +50
    expect(balances).toEqual({
      alice: 50,
      bob: -30,
      charlie: -20,
    })
  })

  it("absorbs rounding drift into the payer when all are overridden", () => {
    const balances = calculateBalances([
      {
        paid_by: "alice",
        amount: 100,
        split_among: ["alice", "bob", "charlie"],
        split_overrides: {
          mode: "percent",
          values: { alice: 33.33, bob: 33.33, charlie: 33.33 },
        },
      },
    ])

    // Each percent → 33.33 share. Sum = 99.99. Drift 0.01 → alice share becomes 33.34.
    // alice: +100 - 33.34 = 66.66
    // bob: -33.33
    // charlie: -33.33
    expect(balances).toEqual({
      alice: 66.66,
      bob: -33.33,
      charlie: -33.33,
    })
    const sum = Object.values(balances).reduce((a, b) => a + b, 0)
    expect(round2Local(sum)).toBe(0)
  })

  it("absorbs drift to payer even when payer is not in split_among", () => {
    const shares = computeShares({
      paid_by: "alice",
      amount: 100,
      split_among: ["bob", "charlie", "dave"],
      split_overrides: {
        mode: "percent",
        values: { bob: 33.33, charlie: 33.33, dave: 33.33 },
      },
    })

    // Each 33.33 → sum 99.99 → drift 0.01 assigned to alice (payer, not in split)
    expect(shares.bob).toBe(33.33)
    expect(shares.charlie).toBe(33.33)
    expect(shares.dave).toBe(33.33)
    expect(shares.alice).toBe(0.01)
    const sumShares = Object.values(shares).reduce((a, b) => a + b, 0)
    expect(round2Local(sumShares)).toBe(100)
  })

  it("ignores overrides for members no longer in split_among", () => {
    const balances = calculateBalances([
      {
        paid_by: "alice",
        amount: 100,
        split_among: ["alice", "bob"],
        split_overrides: {
          mode: "amount",
          values: { charlie: 30 },
        },
      },
    ])

    // charlie override ignored; fall back to equal split
    expect(balances).toEqual({
      alice: 50,
      bob: -50,
    })
  })
})

function round2Local(value: number): number {
  return Math.round(value * 100) / 100
}
