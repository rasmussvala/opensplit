import { describe, expect, it, vi } from "vitest"
import type { SettlementCommand } from "@/application/settlements/manageSettlements"
import { supabase } from "@/lib/supabase"
import { SupabaseSettlementDataSource } from "./supabaseSettlementDataSource"

vi.mock("@/lib/supabase", () => ({
  supabase: { from: vi.fn() },
}))

const command: SettlementCommand = {
  groupId: "group-1",
  from: "member-1",
  to: "member-2",
  amount: 42.5,
}

describe("SupabaseSettlementDataSource", () => {
  it("records a settlement using the existing persistence shape", async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: "settlement-1",
        group_id: "group-1",
        from_member: "member-1",
        to_member: "member-2",
        amount: 42.5,
        settled_at: "2026-01-02T03:04:05.000Z",
      },
      error: null,
    })
    const insert = vi
      .fn()
      .mockReturnValue({ select: vi.fn().mockReturnValue({ single }) })
    vi.mocked(supabase.from).mockReturnValueOnce({ insert } as never)

    await expect(
      new SupabaseSettlementDataSource().record(command),
    ).resolves.toEqual({
      id: "settlement-1",
      from: "member-1",
      to: "member-2",
      amount: 42.5,
      settledAt: "2026-01-02T03:04:05.000Z",
    })
    expect(supabase.from).toHaveBeenCalledWith("settlements")
    expect(insert).toHaveBeenCalledWith({
      group_id: "group-1",
      from_member: "member-1",
      to_member: "member-2",
      amount: 42.5,
    })
  })

  it("normalizes a numeric amount returned by Supabase", async () => {
    const single = vi.fn().mockResolvedValue({
      data: {
        id: "settlement-1",
        group_id: "group-1",
        from_member: "member-1",
        to_member: "member-2",
        amount: "42.5",
        settled_at: "2026-01-02T03:04:05.000Z",
      },
      error: null,
    })
    const insert = vi
      .fn()
      .mockReturnValue({ select: vi.fn().mockReturnValue({ single }) })
    vi.mocked(supabase.from).mockReturnValueOnce({ insert } as never)

    await expect(
      new SupabaseSettlementDataSource().record(command),
    ).resolves.toMatchObject({ amount: 42.5 })
  })

  it("reports recording failures as adapter errors", async () => {
    const single = vi.fn().mockResolvedValue({
      data: null,
      error: { message: "insert denied" },
    })
    const insert = vi
      .fn()
      .mockReturnValue({ select: vi.fn().mockReturnValue({ single }) })
    vi.mocked(supabase.from).mockReturnValueOnce({ insert } as never)

    await expect(
      new SupabaseSettlementDataSource().record(command),
    ).rejects.toThrow("Failed to record settlement: insert denied")
  })

  it("deletes by group and settlement identifier", async () => {
    const eqSettlement = vi.fn().mockResolvedValue({ error: null })
    const eqGroup = vi.fn().mockReturnValue({ eq: eqSettlement })
    const deleteQuery = vi.fn().mockReturnValue({ eq: eqGroup })
    vi.mocked(supabase.from).mockReturnValueOnce({
      delete: deleteQuery,
    } as never)

    await expect(
      new SupabaseSettlementDataSource().delete("group-1", "settlement-1"),
    ).resolves.toBeUndefined()
    expect(deleteQuery).toHaveBeenCalledWith({ count: "exact" })
    expect(eqGroup).toHaveBeenCalledWith("group_id", "group-1")
    expect(eqSettlement).toHaveBeenCalledWith("id", "settlement-1")
  })

  it("reports deletion failures as adapter errors", async () => {
    const eqSettlement = vi
      .fn()
      .mockResolvedValue({ error: { message: "delete denied" } })
    const eqGroup = vi.fn().mockReturnValue({ eq: eqSettlement })
    const deleteQuery = vi.fn().mockReturnValue({ eq: eqGroup })
    vi.mocked(supabase.from).mockReturnValueOnce({
      delete: deleteQuery,
    } as never)

    await expect(
      new SupabaseSettlementDataSource().delete("group-1", "settlement-1"),
    ).rejects.toThrow("Failed to delete settlement: delete denied")
  })
})
