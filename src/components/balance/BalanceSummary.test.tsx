import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"
import type { DbExpense, DbGroupMember, DbSettlement } from "@/lib/types"
import BalanceSummary from "./BalanceSummary"

const mockMembers: DbGroupMember[] = [
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
    user_id: "user-2",
    joined_at: "2026-01-01",
  },
  {
    id: "member-3",
    group_id: "group-1",
    guest_name: "Charlie",
    user_id: "user-3",
    joined_at: "2026-01-01",
  },
]

function renderBalanceSummary(
  overrides: {
    expenses?: DbExpense[]
    settlements?: DbSettlement[]
    members?: DbGroupMember[]
    currency?: string
    inviteToken?: string
  } = {},
) {
  const props = {
    expenses: overrides.expenses ?? [],
    settlements: overrides.settlements ?? [],
    members: overrides.members ?? mockMembers,
    currency: overrides.currency ?? "USD",
    inviteToken: overrides.inviteToken ?? "abc",
  }
  return render(
    <MemoryRouter>
      <BalanceSummary {...props} />
    </MemoryRouter>,
  )
}

describe("BalanceSummary", () => {
  it("shows all settled up when no expenses", () => {
    renderBalanceSummary()

    expect(screen.getByText(/all settled up/i)).toBeInTheDocument()
  })

  it("shows all settled up when fully settled", () => {
    const expenses: DbExpense[] = [
      {
        id: "expense-1",
        group_id: "group-1",
        paid_by: "member-1",
        amount: 100,
        description: "Dinner",
        split_among: ["member-1", "member-2"],
        split_overrides: null,
        created_at: "2026-01-01T12:00:00Z",
      },
    ]
    const settlements: DbSettlement[] = [
      {
        id: "settlement-1",
        group_id: "group-1",
        from_member: "member-2",
        to_member: "member-1",
        amount: 50,
        settled_at: "2026-01-02T12:00:00Z",
      },
    ]

    renderBalanceSummary({ expenses, settlements })

    expect(screen.getByText(/all settled up/i)).toBeInTheDocument()
  })

  it("shows positive balance in the positive theme color", () => {
    const expenses: DbExpense[] = [
      {
        id: "expense-1",
        group_id: "group-1",
        paid_by: "member-1",
        amount: 100,
        description: "Dinner",
        split_among: ["member-1", "member-2"],
        split_overrides: null,
        created_at: "2026-01-01T12:00:00Z",
      },
    ]

    renderBalanceSummary({ expenses })

    const aliceBalance = screen.getByTestId("balance-member-1")
    expect(aliceBalance).toHaveClass("text-positive")
  })

  it("shows negative balance in the destructive theme color", () => {
    const expenses: DbExpense[] = [
      {
        id: "expense-1",
        group_id: "group-1",
        paid_by: "member-1",
        amount: 100,
        description: "Dinner",
        split_among: ["member-1", "member-2"],
        split_overrides: null,
        created_at: "2026-01-01T12:00:00Z",
      },
    ]

    renderBalanceSummary({ expenses })

    const bobBalance = screen.getByTestId("balance-member-2")
    expect(bobBalance).toHaveClass("text-destructive")
  })

  it("shows formatted balance amounts", () => {
    const expenses: DbExpense[] = [
      {
        id: "expense-1",
        group_id: "group-1",
        paid_by: "member-1",
        amount: 100,
        description: "Dinner",
        split_among: ["member-1", "member-2"],
        split_overrides: null,
        created_at: "2026-01-01T12:00:00Z",
      },
    ]

    renderBalanceSummary({ expenses })

    expect(screen.getByText(/\+USD 50\.00/)).toBeInTheDocument()
    expect(screen.getByText(/-USD 50\.00/)).toBeInTheDocument()
  })

  it("shows simplified transaction text with member names", () => {
    const expenses: DbExpense[] = [
      {
        id: "expense-1",
        group_id: "group-1",
        paid_by: "member-1",
        amount: 100,
        description: "Dinner",
        split_among: ["member-1", "member-2"],
        split_overrides: null,
        created_at: "2026-01-01T12:00:00Z",
      },
    ]

    renderBalanceSummary({ expenses })

    expect(screen.getByText(/bob owes alice USD 50\.00/i)).toBeInTheDocument()
  })

  it("renders one settle link per transaction", () => {
    const expenses: DbExpense[] = [
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

    renderBalanceSummary({ expenses })

    expect(screen.getAllByRole("link")).toHaveLength(2)
  })

  it("links each transaction to the settle page", () => {
    const expenses: DbExpense[] = [
      {
        id: "expense-1",
        group_id: "group-1",
        paid_by: "member-1",
        amount: 100,
        description: "Dinner",
        split_among: ["member-1", "member-2"],
        split_overrides: null,
        created_at: "2026-01-01T12:00:00Z",
      },
    ]

    renderBalanceSummary({ expenses, inviteToken: "abc" })

    const link = screen.getByRole("link", { name: /bob owes alice/i })
    expect(link).toHaveAttribute("href", "/groups/abc/settle/member-2/member-1")
  })

  it("applies split_overrides when calculating balances", () => {
    const expenses: DbExpense[] = [
      {
        id: "expense-1",
        group_id: "group-1",
        paid_by: "member-1",
        amount: 500,
        description: "Dinner",
        split_among: ["member-1", "member-2", "member-3"],
        split_overrides: {
          mode: "amount",
          values: { "member-2": 300 },
        },
        created_at: "2026-01-01T12:00:00Z",
      },
    ]

    renderBalanceSummary({ expenses })

    expect(screen.getByText(/bob owes alice USD 300\.00/i)).toBeInTheDocument()
    expect(
      screen.getByText(/charlie owes alice USD 100\.00/i),
    ).toBeInTheDocument()
  })

  it("accounts for partial settlements in balances", () => {
    const expenses: DbExpense[] = [
      {
        id: "expense-1",
        group_id: "group-1",
        paid_by: "member-1",
        amount: 100,
        description: "Dinner",
        split_among: ["member-1", "member-2"],
        split_overrides: null,
        created_at: "2026-01-01T12:00:00Z",
      },
    ]
    const settlements: DbSettlement[] = [
      {
        id: "settlement-1",
        group_id: "group-1",
        from_member: "member-2",
        to_member: "member-1",
        amount: 30,
        settled_at: "2026-01-02T12:00:00Z",
      },
    ]

    renderBalanceSummary({ expenses, settlements })

    expect(screen.getByText(/bob owes alice USD 20\.00/i)).toBeInTheDocument()
    expect(screen.queryByText(/all settled up/i)).not.toBeInTheDocument()
  })
})
