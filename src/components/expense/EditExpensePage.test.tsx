import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { supabase } from "@/lib/supabase"
import EditExpensePage from "./EditExpensePage"

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

function renderPage(inviteToken = "token-abc", expenseId = "exp-1") {
  return render(
    <MemoryRouter
      initialEntries={[`/groups/${inviteToken}/expenses/${expenseId}/edit`]}
    >
      <LocationProbe />
      <Routes>
        <Route
          path="/groups/:inviteToken/expenses/:expenseId/edit"
          element={<EditExpensePage />}
        />
        <Route path="/groups/:inviteToken" element={null} />
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

const mockExpense = {
  id: "exp-1",
  group_id: "group-1",
  description: "Dinner",
  amount: "90.00",
  paid_by: "member-2",
  split_among: ["member-1", "member-2"],
  created_at: "2026-04-01T10:00:00Z",
}

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

type ExpenseTable = {
  select?: ReturnType<typeof vi.fn>
  update?: ReturnType<typeof vi.fn>
  delete?: ReturnType<typeof vi.fn>
}

function expensesTable(opts: {
  fetch?: { data: unknown; error: unknown }
  update?: ReturnType<typeof vi.fn>
  delete?: ReturnType<typeof vi.fn>
}): ExpenseTable {
  const out: ExpenseTable = {}
  if (opts.fetch) {
    out.select = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue(opts.fetch),
      }),
    })
  }
  if (opts.update) out.update = opts.update
  if (opts.delete) out.delete = opts.delete
  return out
}

describe("EditExpensePage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows not found when group does not exist", async () => {
    mockFrom({ groups: groupsMissing() })

    renderPage("bad-token")

    await waitFor(() => {
      expect(screen.getByText(/expense not found/i)).toBeInTheDocument()
    })
  })

  it("shows not found when user is not a member", async () => {
    mockFrom({
      groups: groupsOk(),
      group_members: membersNoMembership(),
    })

    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/expense not found/i)).toBeInTheDocument()
    })
  })

  it("shows not found when expense does not exist", async () => {
    mockFrom({
      groups: groupsOk(),
      group_members: membersReady(),
      expenses: expensesTable({
        fetch: { data: null, error: { message: "not found" } },
      }),
    })

    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/expense not found/i)).toBeInTheDocument()
    })
  })

  it("renders form pre-filled with expense values", async () => {
    mockFrom({
      groups: groupsOk(),
      group_members: membersReady(),
      expenses: expensesTable({ fetch: { data: mockExpense, error: null } }),
    })

    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/edit expense/i)).toBeInTheDocument()
    })

    expect(screen.getByLabelText(/description/i)).toHaveValue("Dinner")
    expect(screen.getByLabelText(/amount/i)).toHaveValue("90")
    expect(
      screen.getByRole("button", { name: /paid by bob/i }),
    ).toHaveAttribute("aria-pressed", "true")
    expect(screen.getByRole("checkbox", { name: /alice/i })).toBeChecked()
    expect(screen.getByRole("checkbox", { name: /bob/i })).toBeChecked()
  })

  it("updates expense and navigates on save", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq })

    mockFrom({
      groups: groupsOk(),
      group_members: membersReady(),
      expenses: expensesTable({
        fetch: { data: mockExpense, error: null },
        update,
      }),
    })

    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/edit expense/i)).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: "Brunch" },
    })
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }))

    await waitFor(() => {
      expect(update).toHaveBeenCalledWith({
        description: "Brunch",
        amount: 90,
        paid_by: "member-2",
        split_among: ["member-1", "member-2"],
        split_overrides: null,
      })
    })
    expect(eq).toHaveBeenCalledWith("id", "exp-1")

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/groups/token-abc",
      )
    })
  })

  it("hydrates and round-trips split_overrides", async () => {
    const expenseWithOverrides = {
      ...mockExpense,
      split_overrides: {
        mode: "amount",
        values: { "member-2": 60 },
      },
    }
    const eq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq })

    mockFrom({
      groups: groupsOk(),
      group_members: membersReady(),
      expenses: expensesTable({
        fetch: { data: expenseWithOverrides, error: null },
        update,
      }),
    })

    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/edit expense/i)).toBeInTheDocument()
    })

    expect(screen.getByLabelText("Bob share")).toHaveValue("60")
    expect(screen.getByLabelText("Bob share")).toHaveClass("font-semibold")

    fireEvent.click(screen.getByRole("button", { name: /^save$/i }))

    await waitFor(() => {
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({
          split_overrides: {
            mode: "amount",
            values: { "member-2": 60 },
          },
        }),
      )
    })
  })

  it("stays on page when update returns error", async () => {
    const eq = vi.fn().mockResolvedValue({ error: { message: "db fail" } })
    const update = vi.fn().mockReturnValue({ eq })

    mockFrom({
      groups: groupsOk(),
      group_members: membersReady(),
      expenses: expensesTable({
        fetch: { data: mockExpense, error: null },
        update,
      }),
    })

    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/edit expense/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: /^save$/i }))

    await waitFor(() => {
      expect(update).toHaveBeenCalled()
    })

    expect(screen.getByTestId("location")).toHaveTextContent(
      "/groups/token-abc/expenses/exp-1/edit",
    )
  })

  it("deletes expense and navigates on delete", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const del = vi.fn().mockReturnValue({ eq })

    mockFrom({
      groups: groupsOk(),
      group_members: membersReady(),
      expenses: expensesTable({
        fetch: { data: mockExpense, error: null },
        delete: del,
      }),
    })

    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/edit expense/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }))

    await waitFor(() => {
      expect(del).toHaveBeenCalled()
    })
    expect(eq).toHaveBeenCalledWith("id", "exp-1")

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/groups/token-abc",
      )
    })
  })

  it("navigates back without mutation on cancel", async () => {
    const update = vi.fn()
    const del = vi.fn()

    mockFrom({
      groups: groupsOk(),
      group_members: membersReady(),
      expenses: expensesTable({
        fetch: { data: mockExpense, error: null },
        update,
        delete: del,
      }),
    })

    renderPage()

    await waitFor(() => {
      expect(screen.getByText(/edit expense/i)).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }))

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/groups/token-abc",
      )
    })
    expect(update).not.toHaveBeenCalled()
    expect(del).not.toHaveBeenCalled()
  })
})
