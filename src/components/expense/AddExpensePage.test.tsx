import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { supabase } from "@/lib/supabase"
import AddExpensePage from "./AddExpensePage"

vi.mock("@/lib/supabase", () => ({
  supabase: { from: vi.fn() },
}))

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({ userId: "test-user-id" }),
}))

function LocationProbe() {
  const loc = useLocation()
  return <div data-testid="location">{loc.pathname}</div>
}

function renderPage(inviteToken = "token-abc") {
  return render(
    <MemoryRouter initialEntries={[`/groups/${inviteToken}/add-expense`]}>
      <LocationProbe />
      <Routes>
        <Route
          path="/groups/:inviteToken/add-expense"
          element={<AddExpensePage />}
        />
      </Routes>
    </MemoryRouter>,
  )
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
    user_id: "test-user-id",
    joined_at: "2026-01-01",
  },
  {
    id: "member-2",
    group_id: "group-1",
    guest_name: "Bob",
    user_id: "user-2",
    joined_at: "2026-01-01",
  },
]

function mockFrom(responses: Record<string, unknown>) {
  vi.mocked(supabase.from).mockImplementation(
    (table: string) =>
      (responses[table] ?? {}) as ReturnType<typeof supabase.from>,
  )
}

function groupsOk(group: unknown = mockGroup) {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: group, error: null }),
      }),
    }),
  }
}

function groupsMissing() {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "not found" },
        }),
      }),
    }),
  }
}

function membersReady(
  membership: unknown = mockMembers[0],
  members: unknown[] = mockMembers,
) {
  const select = vi.fn()
  let n = 0
  select.mockImplementation(() => {
    n++
    if (n === 1) {
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
    return { eq: vi.fn().mockResolvedValue({ data: members, error: null }) }
  })
  return { select }
}

function membersNoMembership() {
  return {
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
  }
}

describe("AddExpensePage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows not found when group does not exist", async () => {
    mockFrom({ groups: groupsMissing() })

    renderPage("bad-token")

    await waitFor(() => {
      expect(screen.getByText(/group not found/i)).toBeInTheDocument()
    })
  })

  it("shows not found when user is not a member", async () => {
    mockFrom({
      groups: groupsOk(),
      group_members: membersNoMembership(),
    })

    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/group not found/i)).toBeInTheDocument()
    })
  })

  it("renders form with currency and members when ready", async () => {
    mockFrom({ groups: groupsOk(), group_members: membersReady() })

    renderPage()

    await waitFor(() => {
      expect(screen.getByText("New expense")).toBeInTheDocument()
    })

    expect(screen.getAllByText("USD").length).toBeGreaterThan(0)
    expect(
      screen.getByRole("button", { name: /paid by alice/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /paid by bob/i }),
    ).toBeInTheDocument()
  })

  it("inserts expense and navigates to group on submit", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null })
    mockFrom({
      groups: groupsOk(),
      group_members: membersReady(),
      expenses: { insert },
    })

    renderPage()

    await waitFor(() => {
      expect(screen.getByText("New expense")).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: "Dinner" },
    })
    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: "42" },
    })
    fireEvent.click(screen.getByRole("button", { name: /^add expense$/i }))

    await waitFor(() => {
      expect(insert).toHaveBeenCalledWith({
        group_id: "group-1",
        description: "Dinner",
        amount: 42,
        paid_by: "member-1",
        split_among: ["member-1", "member-2"],
        split_overrides: null,
      })
    })

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/groups/token-abc",
      )
    })
  })

  it("persists split_overrides when a row is overridden", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null })
    mockFrom({
      groups: groupsOk(),
      group_members: membersReady(),
      expenses: { insert },
    })

    renderPage()

    await waitFor(() => {
      expect(screen.getByText("New expense")).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: "Dinner" },
    })
    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: "500" },
    })
    fireEvent.click(screen.getByRole("button", { name: "USD" }))
    fireEvent.change(screen.getByLabelText("Bob share"), {
      target: { value: "300" },
    })
    fireEvent.click(screen.getByRole("button", { name: /^add expense$/i }))

    await waitFor(() => {
      expect(insert).toHaveBeenCalledWith(
        expect.objectContaining({
          split_overrides: {
            mode: "amount",
            values: { "member-2": 300 },
          },
        }),
      )
    })
  })

  it("stays on page when insert returns error", async () => {
    const insert = vi.fn().mockResolvedValue({ error: { message: "db fail" } })
    mockFrom({
      groups: groupsOk(),
      group_members: membersReady(),
      expenses: { insert },
    })

    renderPage()

    await waitFor(() => {
      expect(screen.getByText("New expense")).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: "Dinner" },
    })
    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: "42" },
    })
    fireEvent.click(screen.getByRole("button", { name: /^add expense$/i }))

    await waitFor(() => {
      expect(insert).toHaveBeenCalled()
    })

    expect(screen.getByTestId("location")).toHaveTextContent(
      "/groups/token-abc/add-expense",
    )
  })
})
