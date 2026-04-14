import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { supabase } from "@/lib/supabase"
import EditSettlementPage from "./EditSettlementPage"

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}))

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({ userId: "test-user-id" }),
}))

function renderWithRoute(inviteToken: string, settlementId: string) {
  return render(
    <MemoryRouter
      initialEntries={[`/groups/${inviteToken}/settlements/${settlementId}`]}
    >
      <Routes>
        <Route
          path="/groups/:inviteToken/settlements/:settlementId"
          element={<EditSettlementPage />}
        />
        <Route path="/groups/:inviteToken" element={<div>Group page</div>} />
      </Routes>
    </MemoryRouter>,
  )
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

const mockGroup = {
  id: "group-1",
  name: "Trip to Oslo",
  currency: "USD",
  invite_token: "token-abc",
}

const mockMembers = [
  {
    id: "member-1",
    group_id: "group-1",
    guest_name: "Alice",
    user_id: "user-1",
    joined_at: "2026-01-01",
  },
  {
    id: "member-2",
    group_id: "group-1",
    guest_name: "Bob",
    user_id: "test-user-id",
    joined_at: "2026-01-01",
  },
]

const mockSettlement = {
  id: "settlement-1",
  group_id: "group-1",
  from_member: "member-2",
  to_member: "member-1",
  amount: 42.5,
  settled_at: "2026-03-04T12:00:00Z",
}

function groupsSingle(data: unknown, error: unknown = null) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data, error }),
      }),
    }),
  }
}

function groupMembersMembershipAndList(
  membership: unknown,
  list: unknown[] = mockMembers,
) {
  const select = vi.fn()
  let call = 0
  select.mockImplementation(() => {
    call++
    if (call === 1) {
      // membership check
      return {
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi
              .fn()
              .mockResolvedValue({ data: membership, error: null }),
          }),
        }),
      }
    }
    // list all members for the group
    return {
      eq: vi.fn().mockResolvedValue({ data: list, error: null }),
    }
  })
  return { select }
}

function settlementsSingle(data: unknown, error: unknown = null) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data, error }),
      }),
    }),
  }
}

describe("EditSettlementPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
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

    renderWithRoute("token-abc", "settlement-1")

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it("shows 'Payment not found' when the group lookup fails", async () => {
    mockSupabaseFrom({
      groups: groupsSingle(null, { message: "not found" }),
    })

    renderWithRoute("token-abc", "settlement-1")

    await waitFor(() => {
      expect(screen.getByText(/payment not found/i)).toBeInTheDocument()
    })
  })

  it("shows 'Payment not found' when the user is not a group member", async () => {
    mockSupabaseFrom({
      groups: groupsSingle(mockGroup),
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

    renderWithRoute("token-abc", "settlement-1")

    await waitFor(() => {
      expect(screen.getByText(/payment not found/i)).toBeInTheDocument()
    })
  })

  it("shows 'Payment not found' when the settlement does not exist", async () => {
    mockSupabaseFrom({
      groups: groupsSingle(mockGroup),
      group_members: groupMembersMembershipAndList({
        id: "member-2",
        group_id: "group-1",
        user_id: "test-user-id",
      }),
      settlements: settlementsSingle(null),
    })

    renderWithRoute("token-abc", "settlement-1")

    await waitFor(() => {
      expect(screen.getByText(/payment not found/i)).toBeInTheDocument()
    })
  })

  it("renders the settlement details when loaded", async () => {
    mockSupabaseFrom({
      groups: groupsSingle(mockGroup),
      group_members: groupMembersMembershipAndList({
        id: "member-2",
        group_id: "group-1",
        user_id: "test-user-id",
      }),
      settlements: settlementsSingle(mockSettlement),
    })

    renderWithRoute("token-abc", "settlement-1")

    await waitFor(() => {
      expect(
        screen.getByText(/bob paid alice USD 42\.50 on MAR 4, 2026/i),
      ).toBeInTheDocument()
    })

    expect(screen.getByText("USD")).toBeInTheDocument()
    expect(screen.getByText("42.50")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /delete payment/i }),
    ).toBeInTheDocument()
  })

  it("deletes the settlement and navigates back to the group page", async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })

    mockSupabaseFrom({
      groups: groupsSingle(mockGroup),
      group_members: groupMembersMembershipAndList({
        id: "member-2",
        group_id: "group-1",
        user_id: "test-user-id",
      }),
      settlements: {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi
              .fn()
              .mockResolvedValue({ data: mockSettlement, error: null }),
          }),
        }),
        delete: mockDelete,
      },
    })

    renderWithRoute("token-abc", "settlement-1")

    const deleteButton = await screen.findByRole("button", {
      name: /delete payment/i,
    })

    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalled()
    })
    expect(mockEq).toHaveBeenCalledWith("id", "settlement-1")

    await waitFor(() => {
      expect(screen.getByText(/group page/i)).toBeInTheDocument()
    })
  })
})
