import { describe, expect, it } from "vitest"
import type {
  Expense,
  Settlement,
} from "@/application/groups/loadGroupSnapshot"
import { calculateSettlementPlan } from "./settlementPlan"

const expense: Expense = {
  id: "expense-1",
  description: "Dinner",
  amount: 100,
  paidBy: "alice",
  splitAmong: ["alice", "bob"],
  splitOverrides: null,
  createdAt: "2026-01-01",
}

const settlement = (from: string, to: string, amount: number): Settlement => ({
  id: "settlement-1",
  from,
  to,
  amount,
  settledAt: "2026-01-02",
})

describe("calculateSettlementPlan", () => {
  it("returns balances and outstanding suggestions", () => {
    expect(calculateSettlementPlan([expense], [])).toEqual({
      balances: { alice: 50, bob: -50 },
      suggestions: [{ from: "bob", to: "alice", amount: 50 }],
    })
  })

  it("preserves current partial-settlement behavior", () => {
    expect(
      calculateSettlementPlan([expense], [settlement("bob", "alice", 20)]),
    ).toEqual({
      balances: { alice: 30, bob: -30 },
      suggestions: [{ from: "bob", to: "alice", amount: 30 }],
    })
  })
})
