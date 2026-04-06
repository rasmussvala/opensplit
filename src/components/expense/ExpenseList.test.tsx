import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"
import type { DbExpense, DbGroupMember } from "@/lib/types"
import ExpenseList from "./ExpenseList"

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
]

const mockExpenses: DbExpense[] = [
  {
    id: "expense-1",
    group_id: "group-1",
    paid_by: "member-1",
    amount: 120,
    description: "Dinner",
    split_among: ["member-1", "member-2"],
    created_at: "2026-01-01T12:00:00Z",
  },
  {
    id: "expense-2",
    group_id: "group-1",
    paid_by: "member-2",
    amount: 45.5,
    description: "Taxi",
    split_among: ["member-1", "member-2"],
    created_at: "2026-01-01T13:00:00Z",
  },
]

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe("ExpenseList", () => {
  it("renders expense list with formatted amounts", () => {
    renderWithRouter(
      <ExpenseList
        expenses={mockExpenses}
        members={mockMembers}
        currency="USD"
        inviteToken="token-abc"
      />,
    )

    expect(screen.getByText("Dinner")).toBeInTheDocument()
    expect(screen.getByText("USD 120.00")).toBeInTheDocument()
    expect(screen.getByText("Taxi")).toBeInTheDocument()
    expect(screen.getByText("USD 45.50")).toBeInTheDocument()
  })

  it("shows who paid each expense", () => {
    renderWithRouter(
      <ExpenseList
        expenses={mockExpenses}
        members={mockMembers}
        currency="USD"
        inviteToken="token-abc"
      />,
    )

    expect(screen.getByText(/paid by alice/i)).toBeInTheDocument()
    expect(screen.getByText(/paid by bob/i)).toBeInTheDocument()
  })

  it("shows split among members", () => {
    renderWithRouter(
      <ExpenseList
        expenses={[mockExpenses[0]]}
        members={mockMembers}
        currency="USD"
        inviteToken="token-abc"
      />,
    )

    expect(screen.getByText(/alice, bob/i)).toBeInTheDocument()
  })

  it("shows empty state when no expenses", () => {
    renderWithRouter(
      <ExpenseList
        expenses={[]}
        members={mockMembers}
        currency="USD"
        inviteToken="token-abc"
      />,
    )

    expect(screen.getByText(/no expenses yet/i)).toBeInTheDocument()
  })

  it("renders expense cards as links to edit route", () => {
    renderWithRouter(
      <ExpenseList
        expenses={[mockExpenses[0]]}
        members={mockMembers}
        currency="USD"
        inviteToken="token-abc"
      />,
    )

    const link = screen.getByRole("link")
    expect(link).toHaveAttribute(
      "href",
      "/groups/token-abc/edit-expense/expense-1",
    )
  })
})
