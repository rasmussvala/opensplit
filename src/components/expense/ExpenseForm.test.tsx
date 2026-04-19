import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { DbGroupMember } from "@/lib/types"
import ExpenseForm from "./ExpenseForm"

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

function renderForm(onSubmit = vi.fn()) {
  render(
    <ExpenseForm
      members={mockMembers}
      currency="USD"
      submitLabel="Add expense"
      onSubmit={onSubmit}
    />,
  )
  return { onSubmit }
}

describe("ExpenseForm", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders form with all fields", () => {
    renderForm()

    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument()
    expect(screen.getByText(/^paid by$/i)).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /paid by alice/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /paid by bob/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /paid by charlie/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /add expense/i }),
    ).toBeInTheDocument()
  })

  it("defaults to first member as payer", () => {
    renderForm()

    expect(
      screen.getByRole("button", { name: /paid by alice/i }),
    ).toHaveAttribute("aria-pressed", "true")
    expect(
      screen.getByRole("button", { name: /paid by bob/i }),
    ).toHaveAttribute("aria-pressed", "false")
  })

  it("checks all members for split by default", () => {
    renderForm()

    for (const m of mockMembers) {
      expect(screen.getByRole("checkbox", { name: m.guest_name })).toBeChecked()
    }
  })

  it("toggles split membership when a member is unchecked", () => {
    renderForm()

    fireEvent.click(screen.getByRole("checkbox", { name: /charlie/i }))

    expect(screen.getByRole("checkbox", { name: /charlie/i })).not.toBeChecked()
    expect(screen.getByRole("checkbox", { name: /alice/i })).toBeChecked()
    expect(screen.getByRole("checkbox", { name: /bob/i })).toBeChecked()
  })

  it("calls onSubmit with form data", () => {
    const { onSubmit } = renderForm()

    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: "Dinner" },
    })
    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: "90" },
    })
    fireEvent.click(screen.getByRole("button", { name: /paid by bob/i }))
    fireEvent.click(screen.getByRole("button", { name: /add expense/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      description: "Dinner",
      amount: 90,
      paidBy: "member-2",
      splitAmong: ["member-1", "member-2", "member-3"],
    })
  })

  it("does not submit if description is empty", () => {
    const { onSubmit } = renderForm()

    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: "50" },
    })

    fireEvent.click(screen.getByRole("button", { name: /add expense/i }))

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("does not submit if amount is zero", () => {
    const { onSubmit } = renderForm()

    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: "Dinner" },
    })

    fireEvent.click(screen.getByRole("button", { name: /add expense/i }))

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("shows a live share per checked member once amount is entered", () => {
    renderForm()

    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: "90" },
    })

    for (const m of mockMembers) {
      expect(screen.getByTestId(`share-${m.id}`)).toHaveTextContent("30.00")
    }
  })

  it("hides share for unchecked members and redistributes remainder", () => {
    renderForm()

    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: "90" },
    })
    fireEvent.click(screen.getByRole("checkbox", { name: /charlie/i }))

    expect(screen.queryByTestId("share-member-3")).not.toBeInTheDocument()
    expect(screen.getByTestId("share-member-1")).toHaveTextContent("45.00")
    expect(screen.getByTestId("share-member-2")).toHaveTextContent("45.00")
  })

  it("does not submit if no members are selected for split", () => {
    const { onSubmit } = renderForm()

    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: "Dinner" },
    })
    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: "50" },
    })

    fireEvent.click(screen.getByRole("checkbox", { name: /alice/i }))
    fireEvent.click(screen.getByRole("checkbox", { name: /bob/i }))
    fireEvent.click(screen.getByRole("checkbox", { name: /charlie/i }))

    fireEvent.click(screen.getByRole("button", { name: /add expense/i }))

    expect(onSubmit).not.toHaveBeenCalled()
  })
})
