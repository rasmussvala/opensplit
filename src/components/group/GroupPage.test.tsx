import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { supabase } from "@/lib/supabase"
import GroupPage from "./GroupPage"

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn(),
    removeChannel: vi.fn(),
  },
}))

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({ userId: "test-user-id" }),
}))

function renderWithRoute(inviteToken: string) {
  return render(
    <MemoryRouter initialEntries={[`/groups/${inviteToken}`]}>
      <Routes>
        <Route path="/groups/:inviteToken" element={<GroupPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function createMockChannel() {
  const channel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  }
  vi.mocked(supabase.channel).mockReturnValue(
    channel as unknown as ReturnType<typeof supabase.channel>,
  )
  vi.mocked(supabase.removeChannel).mockResolvedValue("ok" as never)
  return channel
}

function mockSupabaseFrom(responses: Record<string, unknown>) {
  vi.mocked(supabase.from).mockImplementation((table: string) => {
    const response = responses[table]
    if (!response) {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "not found" },
            }),
          }),
        }),
      } as unknown as ReturnType<typeof supabase.from>
    }
    return response as ReturnType<typeof supabase.from>
  })
}

describe("GroupPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createMockChannel()
  })

  it("shows loading state initially", () => {
    mockSupabaseFrom({
      groups: {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockReturnValue(new Promise(() => {})),
          }),
        }),
      },
    })

    renderWithRoute("token-abc")

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it("shows error when group is not found", async () => {
    mockSupabaseFrom({
      groups: {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "not found" },
            }),
          }),
        }),
      },
    })

    renderWithRoute("invalid-token")

    await waitFor(() => {
      expect(screen.getByText(/group not found/i)).toBeInTheDocument()
    })
  })

  it("shows join form when user is not a member", async () => {
    const mockGroup = {
      id: "group-1",
      name: "Trip to Oslo",
      currency: "USD",
      invite_token: "token-abc",
    }

    mockSupabaseFrom({
      groups: {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockGroup, error: null }),
          }),
        }),
      },
      group_members: {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi
                .fn()
                .mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      },
    })

    renderWithRoute("token-abc")

    await waitFor(() => {
      expect(screen.getByText(/join trip to oslo/i)).toBeInTheDocument()
    })
  })

  it("shows group page when user is a member", async () => {
    const mockGroup = {
      id: "group-1",
      name: "Trip to Oslo",
      currency: "USD",
      invite_token: "token-abc",
    }
    const mockMember = {
      id: "member-1",
      group_id: "group-1",
      guest_name: "Alice",
      user_id: "test-user-id",
    }
    const mockMembers = [mockMember]

    const groupMembersSelectMock = vi.fn()

    // First call: membership check (with two .eq() chains + maybeSingle)
    // Second call: fetch all members (with one .eq() chain, resolves to array)
    let groupMembersCallCount = 0
    groupMembersSelectMock.mockImplementation(() => {
      groupMembersCallCount++
      if (groupMembersCallCount === 1) {
        // membership check
        return {
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi
                .fn()
                .mockResolvedValue({ data: mockMember, error: null }),
            }),
          }),
        }
      }
      // fetch all members
      return {
        eq: vi.fn().mockResolvedValue({ data: mockMembers, error: null }),
      }
    })

    mockSupabaseFrom({
      groups: {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockGroup, error: null }),
          }),
        }),
      },
      group_members: {
        select: groupMembersSelectMock,
      },
      expenses: {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      },
      settlements: {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      },
    })

    renderWithRoute("token-abc")

    await waitFor(() => {
      expect(screen.getByText("Trip to Oslo")).toBeInTheDocument()
    })

    expect(
      screen.getByRole("link", { name: /add expense/i }),
    ).toBeInTheDocument()
  })

  it("shows all settled up when no expenses", async () => {
    const mockGroup = {
      id: "group-1",
      name: "Trip to Oslo",
      currency: "USD",
      invite_token: "token-abc",
    }
    const mockMember = {
      id: "member-1",
      group_id: "group-1",
      guest_name: "Alice",
      user_id: "test-user-id",
    }
    const mockMembers = [mockMember]

    const groupMembersSelectMock = vi.fn()
    let groupMembersCallCount = 0
    groupMembersSelectMock.mockImplementation(() => {
      groupMembersCallCount++
      if (groupMembersCallCount === 1) {
        return {
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi
                .fn()
                .mockResolvedValue({ data: mockMember, error: null }),
            }),
          }),
        }
      }
      return {
        eq: vi.fn().mockResolvedValue({ data: mockMembers, error: null }),
      }
    })

    mockSupabaseFrom({
      groups: {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockGroup, error: null }),
          }),
        }),
      },
      group_members: {
        select: groupMembersSelectMock,
      },
      expenses: {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      },
      settlements: {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      },
    })

    renderWithRoute("token-abc?tab=balances")

    await waitFor(() => {
      expect(screen.getByText(/all settled up/i)).toBeInTheDocument()
    })
  })

  it("shows the balances you filter for the signed-in member when settlements exist", async () => {
    const mockGroup = {
      id: "group-1",
      name: "Trip to Oslo",
      currency: "USD",
      invite_token: "token-abc",
    }
    const mockMember = {
      id: "member-2",
      group_id: "group-1",
      guest_name: "Bob",
      user_id: "test-user-id",
    }
    const mockMembers = [
      {
        id: "member-1",
        group_id: "group-1",
        guest_name: "Alice",
        user_id: "user-1",
      },
      mockMember,
      {
        id: "member-3",
        group_id: "group-1",
        guest_name: "Charlie",
        user_id: "user-3",
      },
    ]
    const mockExpenses = [
      {
        id: "expense-1",
        group_id: "group-1",
        paid_by: "member-1",
        amount: 120,
        description: "Dinner",
        split_among: ["member-1", "member-2", "member-3"],
        split_overrides: null,
        created_at: "2026-01-01T12:00:00Z",
      },
    ]

    const groupMembersSelectMock = vi.fn()
    let groupMembersCallCount = 0
    groupMembersSelectMock.mockImplementation(() => {
      groupMembersCallCount++
      if (groupMembersCallCount === 1) {
        return {
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi
                .fn()
                .mockResolvedValue({ data: mockMember, error: null }),
            }),
          }),
        }
      }
      return {
        eq: vi.fn().mockResolvedValue({ data: mockMembers, error: null }),
      }
    })

    mockSupabaseFrom({
      groups: {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockGroup, error: null }),
          }),
        }),
      },
      group_members: {
        select: groupMembersSelectMock,
      },
      expenses: {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: mockExpenses, error: null }),
        }),
      },
      settlements: {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      },
    })

    renderWithRoute("token-abc?tab=balances")

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /only you/i }),
      ).toHaveAttribute("aria-pressed", "false")
    })
  })

  it("subscribes to realtime changes when user is a member", async () => {
    const mockGroup = {
      id: "group-1",
      name: "Trip to Oslo",
      currency: "USD",
      invite_token: "token-abc",
    }
    const mockMember = {
      id: "member-1",
      group_id: "group-1",
      guest_name: "Alice",
      user_id: "test-user-id",
    }

    const groupMembersSelectMock = vi.fn()
    let groupMembersCallCount = 0
    groupMembersSelectMock.mockImplementation(() => {
      groupMembersCallCount++
      if (groupMembersCallCount === 1) {
        return {
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi
                .fn()
                .mockResolvedValue({ data: mockMember, error: null }),
            }),
          }),
        }
      }
      return {
        eq: vi.fn().mockResolvedValue({ data: [mockMember], error: null }),
      }
    })

    mockSupabaseFrom({
      groups: {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockGroup, error: null }),
          }),
        }),
      },
      group_members: { select: groupMembersSelectMock },
      expenses: {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      },
      settlements: {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      },
    })

    const channel = createMockChannel()
    renderWithRoute("token-abc")

    await waitFor(() => {
      expect(screen.getByText("Trip to Oslo")).toBeInTheDocument()
    })

    expect(supabase.channel).toHaveBeenCalledWith("group-group-1")
    expect(channel.on).toHaveBeenCalledTimes(3)
    expect(channel.on).toHaveBeenCalledWith(
      "postgres_changes",
      { event: "*", schema: "public", table: "expenses" },
      expect.any(Function),
    )
    expect(channel.on).toHaveBeenCalledWith(
      "postgres_changes",
      { event: "*", schema: "public", table: "settlements" },
      expect.any(Function),
    )
    expect(channel.on).toHaveBeenCalledWith(
      "postgres_changes",
      { event: "*", schema: "public", table: "group_members" },
      expect.any(Function),
    )
    expect(channel.subscribe).toHaveBeenCalledOnce()
  })

  it("cleans up realtime subscription on unmount", async () => {
    const mockGroup = {
      id: "group-1",
      name: "Trip to Oslo",
      currency: "USD",
      invite_token: "token-abc",
    }
    const mockMember = {
      id: "member-1",
      group_id: "group-1",
      guest_name: "Alice",
      user_id: "test-user-id",
    }

    const groupMembersSelectMock = vi.fn()
    let groupMembersCallCount = 0
    groupMembersSelectMock.mockImplementation(() => {
      groupMembersCallCount++
      if (groupMembersCallCount === 1) {
        return {
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi
                .fn()
                .mockResolvedValue({ data: mockMember, error: null }),
            }),
          }),
        }
      }
      return {
        eq: vi.fn().mockResolvedValue({ data: [mockMember], error: null }),
      }
    })

    mockSupabaseFrom({
      groups: {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockGroup, error: null }),
          }),
        }),
      },
      group_members: { select: groupMembersSelectMock },
      expenses: {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      },
      settlements: {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      },
    })

    const channel = createMockChannel()
    const { unmount } = renderWithRoute("token-abc")

    await waitFor(() => {
      expect(screen.getByText("Trip to Oslo")).toBeInTheDocument()
    })

    unmount()

    expect(supabase.removeChannel).toHaveBeenCalledWith(channel)
  })

  it("does not subscribe to realtime when not a member", async () => {
    const mockGroup = {
      id: "group-1",
      name: "Trip to Oslo",
      currency: "USD",
      invite_token: "token-abc",
    }

    mockSupabaseFrom({
      groups: {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockGroup, error: null }),
          }),
        }),
      },
      group_members: {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi
                .fn()
                .mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      },
    })

    renderWithRoute("token-abc")

    await waitFor(() => {
      expect(screen.getByText(/join trip to oslo/i)).toBeInTheDocument()
    })

    expect(supabase.channel).not.toHaveBeenCalled()
  })
})
