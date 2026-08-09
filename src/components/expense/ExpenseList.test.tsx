import { render, screen } from "@testing-library/react"
import type { ReactElement } from "react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"
import type { Expense, Member } from "@/application/groups/loadGroupSnapshot"
import ExpenseList from "./ExpenseList"

const mockMembers: Member[] = [
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
    swishPhone: null,
  },
]

const mockExpenses: Expense[] = [
  {
    id: "expense-1",
    description: "Dinner",
    amount: 120,
    paidBy: "member-1",
    splitAmong: ["member-1", "member-2"],
    splitOverrides: null,
    createdAt: "2026-01-01T12:00:00Z",
  },
  {
    id: "expense-2",
    description: "Taxi",
    amount: 45.5,
    paidBy: "member-2",
    splitAmong: ["member-1", "member-2"],
    splitOverrides: null,
    createdAt: "2026-01-01T13:00:00Z",
  },
]

function renderWithRouter(ui: ReactElement) {
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

  it("renders newest expenses first", () => {
    renderWithRouter(
      <ExpenseList
        expenses={mockExpenses}
        members={mockMembers}
        currency="USD"
        inviteToken="token-abc"
      />,
    )

    const links = screen.getAllByRole("link")
    expect(links[0]).toHaveAttribute(
      "href",
      "/groups/token-abc/edit-expense/expense-2",
    )
    expect(links[1]).toHaveAttribute(
      "href",
      "/groups/token-abc/edit-expense/expense-1",
    )
  })
})
