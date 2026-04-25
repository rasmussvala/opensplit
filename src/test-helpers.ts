import type { DbExpense, DbGroup, DbGroupMember } from "@/lib/types"

export function makeGroup(overrides: Partial<DbGroup> = {}): DbGroup {
  return {
    id: "g1",
    name: "Test Group",
    currency: "USD",
    invite_token: "invite-abc",
    created_by: "u1",
    created_at: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

export function makeMember(
  overrides: Partial<DbGroupMember> = {},
): DbGroupMember {
  return {
    id: "m1",
    group_id: "g1",
    guest_name: "Alice",
    user_id: "u1",
    joined_at: "2026-01-01T00:00:00Z",
    ...overrides,
  }
}

export function makeExpense(overrides: Partial<DbExpense> = {}): DbExpense {
  return {
    id: "e1",
    group_id: "g1",
    paid_by: "m1",
    amount: 100,
    description: "Pizza",
    split_among: ["m1", "m2"],
    split_overrides: null,
    created_at: "2026-01-15T00:00:00Z",
    ...overrides,
  }
}
