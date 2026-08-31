import { describe, expect, it } from "vitest"
import type { GroupDataSource } from "@/application/groups/loadGroupSnapshot"
import { InMemoryGroupDataSource } from "@/application/groups/loadGroupSnapshot"
import {
  type ExpenseDataSource,
  type ExpenseInput,
  manageExpenses,
} from "./manageExpenses"

const group = {
  id: "group-1",
  name: "Trip",
  currency: "SEK",
  invite_token: "trip",
}
const member = {
  id: "member-1",
  group_id: "group-1",
  guest_name: "Alice",
  user_id: "user-1",
  swish_phone: null,
}
const input: ExpenseInput = {
  description: "Dinner",
  amount: 100,
  paidBy: "member-1",
  splitAmong: ["member-1"],
  splitOverrides: null,
}

function source(): ExpenseDataSource & { calls: string[] } {
  const calls: string[] = []
  return {
    calls,
    async create(groupId, value) {
      calls.push(`create:${groupId}:${value.description}`)
    },
    async update(expenseId, value) {
      calls.push(`update:${expenseId}:${value.description}`)
    },
    async delete(expenseId) {
      calls.push(`delete:${expenseId}`)
    },
  }
}

describe("manageExpenses", () => {
  it("loads creation context through the group snapshot interface", async () => {
    const groups = new InMemoryGroupDataSource({
      groups: [group],
      members: [member],
    })
    await expect(
      manageExpenses(groups, source()).loadCreateContext("trip", "user-1"),
    ).resolves.toMatchObject({
      groupId: "group-1",
      currency: "SEK",
      currentMemberId: "member-1",
    })
  })

  it("returns no context for a non-member or missing expense", async () => {
    const groups: GroupDataSource = new InMemoryGroupDataSource({
      groups: [group],
      members: [member],
    })
    const manage = manageExpenses(groups, source())
    await expect(
      manage.loadCreateContext("trip", "other-user"),
    ).resolves.toBeNull()
    await expect(
      manage.loadContext("trip", "user-1", "missing"),
    ).resolves.toBeNull()
  })

  it("delegates mutations through the expense data-source interface", async () => {
    const expenses = source()
    const manage = manageExpenses(new InMemoryGroupDataSource(), expenses)
    await manage.create("group-1", input)
    await manage.update("expense-1", input)
    await manage.delete("expense-1")
    expect(expenses.calls).toEqual([
      "create:group-1:Dinner",
      "update:expense-1:Dinner",
      "delete:expense-1",
    ])
  })
})
