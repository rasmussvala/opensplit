import { describe, expect, it } from "vitest"
import { InMemoryGroupDataSource, loadGroupSnapshot } from "./loadGroupSnapshot"

const group = {
  id: "group-1",
  name: "Weekend trip",
  currency: "SEK",
  invite_token: "trip-token",
}

describe("loadGroupSnapshot", () => {
  it("returns not-found when the invite token does not identify a group", async () => {
    const dataSource = new InMemoryGroupDataSource()

    await expect(
      loadGroupSnapshot(dataSource).execute({
        inviteToken: "missing-token",
        userId: "user-1",
      }),
    ).resolves.toEqual({ status: "not-found" })
  })

  it("returns join-required when the group exists but the user is not a member", async () => {
    const dataSource = new InMemoryGroupDataSource({ groups: [group] })

    await expect(
      loadGroupSnapshot(dataSource).execute({
        inviteToken: "trip-token",
        userId: "user-1",
      }),
    ).resolves.toEqual({
      status: "join-required",
      group: {
        id: "group-1",
        name: "Weekend trip",
        currency: "SEK",
        inviteToken: "trip-token",
      },
    })
  })

  it("returns a mapped snapshot for a group member", async () => {
    const dataSource = new InMemoryGroupDataSource({
      groups: [group],
      members: [
        {
          id: "member-1",
          group_id: "group-1",
          guest_name: "Alice",
          user_id: "user-1",
          swish_phone: null,
        },
        {
          id: "member-2",
          group_id: "group-1",
          guest_name: "Bob",
          user_id: "user-2",
          swish_phone: "46701234567",
        },
      ],
      expenses: [
        {
          id: "expense-1",
          group_id: "group-1",
          paid_by: "member-1",
          amount: "100.50",
          description: "Dinner",
          split_among: ["member-1", "member-2"],
          split_overrides: null,
          created_at: "2026-01-01T12:00:00Z",
        },
      ],
      settlements: [
        {
          id: "settlement-1",
          group_id: "group-1",
          from_member: "member-2",
          to_member: "member-1",
          amount: "50.25",
          settled_at: "2026-01-02T12:00:00Z",
        },
      ],
    })

    await expect(
      loadGroupSnapshot(dataSource).execute({
        inviteToken: "trip-token",
        userId: "user-1",
      }),
    ).resolves.toEqual({
      status: "member",
      snapshot: {
        group: {
          id: "group-1",
          name: "Weekend trip",
          currency: "SEK",
          inviteToken: "trip-token",
        },
        currentMember: {
          id: "member-1",
          name: "Alice",
          userId: "user-1",
          swishPhone: null,
        },
        members: [
          {
            id: "member-1",
            name: "Alice",
            userId: "user-1",
            swishPhone: null,
          },
          {
            id: "member-2",
            name: "Bob",
            userId: "user-2",
            swishPhone: "46701234567",
          },
        ],
        expenses: [
          {
            id: "expense-1",
            description: "Dinner",
            amount: 100.5,
            paidBy: "member-1",
            splitAmong: ["member-1", "member-2"],
            splitOverrides: null,
            createdAt: "2026-01-01T12:00:00Z",
          },
        ],
        settlements: [
          {
            id: "settlement-1",
            from: "member-2",
            to: "member-1",
            amount: 50.25,
            settledAt: "2026-01-02T12:00:00Z",
          },
        ],
      },
    })
  })
})
