import { describe, expect, it } from "vitest"
import type { GroupSnapshot } from "@/application/groups/loadGroupSnapshot"
import {
  InMemorySettlementDataSource,
  manageSettlements,
  type SettlementDataSource,
} from "./manageSettlements"

const snapshot: GroupSnapshot = {
  group: { id: "group-1", name: "Trip", currency: "SEK", inviteToken: "trip" },
  currentMember: {
    id: "alice",
    name: "Alice",
    userId: "user-1",
    swishPhone: null,
  },
  members: [
    { id: "alice", name: "Alice", userId: "user-1", swishPhone: null },
    { id: "bob", name: "Bob", userId: "user-2", swishPhone: null },
  ],
  expenses: [
    {
      id: "expense-1",
      description: "Dinner",
      amount: 100,
      paidBy: "alice",
      splitAmong: ["alice", "bob"],
      splitOverrides: null,
      createdAt: "2026-01-01",
    },
  ],
  settlements: [],
}

const input = (amount: number, from = "bob", to = "alice") => ({
  groupId: "group-1",
  from,
  to,
  amount,
  snapshot,
})

describe("ManageSettlements", () => {
  it("suggests outstanding settlements from a snapshot, including partial and reverse settlements", async () => {
    const source = new InMemorySettlementDataSource()
    const manage = manageSettlements(source)

    await expect(manage.suggest(snapshot)).resolves.toEqual([
      { from: "bob", to: "alice", amount: 50 },
    ])
    await source.record({
      groupId: "group-1",
      from: "bob",
      to: "alice",
      amount: 20,
    })
    await expect(
      manage.suggest({
        ...snapshot,
        settlements: await source.list("group-1"),
      }),
    ).resolves.toEqual([{ from: "bob", to: "alice", amount: 30 }])
    await source.record({
      groupId: "group-1",
      from: "alice",
      to: "bob",
      amount: 10,
    })
    await expect(
      manage.suggest({
        ...snapshot,
        settlements: await source.list("group-1"),
      }),
    ).resolves.toEqual([{ from: "bob", to: "alice", amount: 40 }])
  })

  it("returns no outstanding suggestion when the balance is settled", async () => {
    const source = new InMemorySettlementDataSource()
    await source.record({
      groupId: "group-1",
      from: "bob",
      to: "alice",
      amount: 50,
    })
    await expect(
      manageSettlements(source).suggest({
        ...snapshot,
        settlements: await source.list("group-1"),
      }),
    ).resolves.toEqual([])
  })

  it.each([
    [0, "invalid-amount"],
    [-1, "invalid-amount"],
    [Number.NaN, "invalid-amount"],
    [50.01, "exceeds-outstanding"],
  ])("rejects amount %s with %s", async (amount, status) => {
    await expect(
      manageSettlements(new InMemorySettlementDataSource()).record(
        input(amount),
      ),
    ).resolves.toEqual({ status })
  })

  it("rejects same-member and non-outstanding transfers", async () => {
    const manage = manageSettlements(new InMemorySettlementDataSource())
    await expect(manage.record(input(10, "alice", "alice"))).resolves.toEqual({
      status: "same-member",
    })
    await expect(manage.record(input(10, "alice", "bob"))).resolves.toEqual({
      status: "no-outstanding",
    })
  })

  it("records a normalized amount and deletes through the data-source seam", async () => {
    const source = new InMemorySettlementDataSource()
    const manage = manageSettlements(source)
    const result = await manage.record(input(12.345))
    expect(result).toMatchObject({
      status: "recorded",
      settlement: { amount: 12.35 },
    })
    const recorded = await manage.record(input(12.344))
    expect(recorded).toMatchObject({
      status: "recorded",
      settlement: { amount: 12.34 },
    })
    if (recorded.status === "recorded")
      await expect(
        manage.delete("group-1", recorded.settlement.id),
      ).resolves.toEqual({ status: "deleted" })
  })

  it("lets adapter failures remain errors", async () => {
    const source: SettlementDataSource = {
      record: async () => {
        throw new Error("storage down")
      },
      delete: async () => {
        throw new Error("storage down")
      },
    }
    await expect(manageSettlements(source).record(input(10))).rejects.toThrow(
      "storage down",
    )
    await expect(
      manageSettlements(source).delete("group-1", "settlement-1"),
    ).rejects.toThrow("storage down")
  })
})
