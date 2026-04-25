import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { supabase } from "@/lib/supabase"
import SettlePage from "./SettlePage"

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}))

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({ userId: "test-user-id" }),
}))

const mockGroup = {
  id: "group-1",
  name: "Trip",
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

const mockExpense = {
  id: "expense-1",
  group_id: "group-1",
  paid_by: "member-1",
  amount: 100,
  description: "Dinner",
  split_among: ["member-1", "member-2"],
  split_overrides: null,
  created_at: "2026-01-01T12:00:00Z",
}

interface SetupOptions {
  group?: typeof mockGroup | null
  members?: typeof mockMembers
  expenses?: (typeof mockExpense)[]
  settlements?: unknown[]
  membership?: unknown
  insertResponse?: { error: unknown }
}

function setupSupabase(options: SetupOptions = {}) {
  const {
    group = mockGroup,
    members = mockMembers,
    expenses = [mockExpense],
    settlements = [],
    membership = {
      id: "member-2",
      group_id: "group-1",
      user_id: "test-user-id",
    },
    insertResponse = { error: null },
  } = options

  const insertMock = vi.fn().mockResolvedValue(insertResponse)

  let groupMembersCallCount = 0

  vi.mocked(supabase.from).mockImplementation((table: string) => {
    if (table === "groups") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: group,
              error: group ? null : { message: "not found" },
            }),
          }),
        }),
      } as unknown as ReturnType<typeof supabase.from>
    }
    if (table === "group_members") {
      groupMembersCallCount++
      if (groupMembersCallCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi
                  .fn()
                  .mockResolvedValue({ data: membership, error: null }),
              }),
            }),
          }),
        } as unknown as ReturnType<typeof supabase.from>
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: members, error: null }),
        }),
      } as unknown as ReturnType<typeof supabase.from>
    }
    if (table === "expenses") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: expenses, error: null }),
        }),
      } as unknown as ReturnType<typeof supabase.from>
    }
    if (table === "settlements") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: settlements, error: null }),
        }),
        insert: insertMock,
      } as unknown as ReturnType<typeof supabase.from>
    }
    throw new Error(`Unexpected table: ${table}`)
  })

  return { insertMock }
}

function renderRoute(
  inviteToken = "token-abc",
  fromMemberId = "member-2",
  toMemberId = "member-1",
) {
  return render(
    <MemoryRouter
      initialEntries={[
        `/groups/${inviteToken}/settle/${fromMemberId}/${toMemberId}`,
      ]}
    >
      <Routes>
        <Route
          path="/groups/:inviteToken/settle/:fromMemberId/:toMemberId"
          element={<SettlePage />}
        />
        <Route path="/groups/:inviteToken" element={<div>Group page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe("SettlePage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows loading state initially", () => {
    vi.mocked(supabase.from).mockImplementation(
      () =>
        ({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockReturnValue(new Promise(() => {})),
            }),
          }),
        }) as unknown as ReturnType<typeof supabase.from>,
    )

    renderRoute()

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it("shows not-found when the group lookup fails", async () => {
    setupSupabase({ group: null })

    renderRoute()

    await waitFor(() => {
      expect(screen.getByText(/settlement not found/i)).toBeInTheDocument()
    })
  })

  it("shows not-found when the user is not a group member", async () => {
    setupSupabase({ membership: null })

    renderRoute()

    await waitFor(() => {
      expect(screen.getByText(/settlement not found/i)).toBeInTheDocument()
    })
  })

  it("renders the proposed settlement amount and names", async () => {
    setupSupabase()

    renderRoute()

    await waitFor(() => {
      expect(screen.getByText(/bob owes alice USD 50\.00/i)).toBeInTheDocument()
    })

    expect(screen.getByText("USD")).toBeInTheDocument()
    expect(screen.getByText("50.00")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /mark settled/i }),
    ).toBeInTheDocument()
  })

  it("shows the no-outstanding-debt empty state when already settled", async () => {
    setupSupabase({
      settlements: [
        {
          id: "s1",
          group_id: "group-1",
          from_member: "member-2",
          to_member: "member-1",
          amount: 50,
          settled_at: "2026-01-02T12:00:00Z",
        },
      ],
    })

    renderRoute()

    await waitFor(() => {
      expect(
        screen.getByText(/no outstanding debt between bob and alice/i),
      ).toBeInTheDocument()
    })
    expect(
      screen.queryByRole("button", { name: /mark settled/i }),
    ).not.toBeInTheDocument()
  })

  it("inserts a settlement and navigates to the payments tab", async () => {
    const { insertMock } = setupSupabase()

    renderRoute()

    const settleButton = await screen.findByRole("button", {
      name: /mark settled/i,
    })
    fireEvent.click(settleButton)

    await waitFor(() => {
      expect(insertMock).toHaveBeenCalledWith({
        group_id: "group-1",
        from_member: "member-2",
        to_member: "member-1",
        amount: 50,
      })
    })

    await waitFor(() => {
      expect(screen.getByText(/group page/i)).toBeInTheDocument()
    })
  })
})
