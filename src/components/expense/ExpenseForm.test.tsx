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
      splitOverrides: null,
    })
  })

  it("submits splitOverrides when a row has an override", () => {
    const { onSubmit } = renderForm()

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
    fireEvent.click(screen.getByRole("button", { name: /add expense/i }))

    expect(onSubmit).toHaveBeenCalledWith({
      description: "Dinner",
      amount: 500,
      paidBy: "member-1",
      splitAmong: ["member-1", "member-2", "member-3"],
      splitOverrides: {
        mode: "amount",
        values: { "member-2": 300 },
      },
    })
  })

  it("hydrates initialSplitOverrides", () => {
    const onSubmit = vi.fn()
    render(
      <ExpenseForm
        members={mockMembers}
        currency="USD"
        initialDescription="Dinner"
        initialAmount="500"
        initialPaidBy="member-1"
        initialSplitAmong={["member-1", "member-2", "member-3"]}
        initialSplitOverrides={{
          mode: "amount",
          values: { "member-2": 300 },
        }}
        submitLabel="Save"
        onSubmit={onSubmit}
      />,
    )

    expect(screen.getByLabelText("Bob share")).toHaveValue("300")
    expect(screen.getByLabelText("Bob share")).toHaveClass("font-semibold")
    expect(screen.getByRole("button", { name: "USD" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )

    fireEvent.click(screen.getByRole("button", { name: /save/i }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        splitOverrides: {
          mode: "amount",
          values: { "member-2": 300 },
        },
      }),
    )
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

  it("shows percent auto values in each row input by default", () => {
    renderForm()

    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: "90" },
    })

    for (const m of mockMembers) {
      expect(screen.getByLabelText(`${m.guest_name} share`)).toHaveValue(
        "33.33",
      )
    }
  })

  it("toggles suffix and recomputes auto values when switching mode", () => {
    renderForm()

    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: "90" },
    })

    fireEvent.click(screen.getByRole("button", { name: "USD" }))

    for (const m of mockMembers) {
      expect(screen.getByLabelText(`${m.guest_name} share`)).toHaveValue("30")
    }
  })

  it("bolds overridden row and redistributes auto shares", () => {
    renderForm()

    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: "90" },
    })
    fireEvent.click(screen.getByRole("button", { name: "USD" }))

    const bobInput = screen.getByLabelText("Bob share")
    fireEvent.change(bobInput, { target: { value: "50" } })

    expect(bobInput).toHaveClass("font-semibold")
    expect(bobInput).toHaveValue("50")
    expect(screen.getByLabelText("Alice share")).toHaveValue("20")
    expect(screen.getByLabelText("Charlie share")).toHaveValue("20")
    expect(screen.getByTestId("share-member-2")).toHaveTextContent("50.00")
    expect(screen.getByTestId("share-member-1")).toHaveTextContent("20.00")
  })

  it("reverts a row to auto when the override is cleared", () => {
    renderForm()

    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: "90" },
    })
    fireEvent.click(screen.getByRole("button", { name: "USD" }))

    const bobInput = screen.getByLabelText("Bob share")
    fireEvent.change(bobInput, { target: { value: "50" } })
    expect(bobInput).toHaveClass("font-semibold")

    fireEvent.change(bobInput, { target: { value: "" } })
    fireEvent.blur(bobInput)

    expect(bobInput).toHaveValue("30")
    expect(bobInput).not.toHaveClass("font-semibold")
  })

  it("disables input and clears override when member is unchecked", () => {
    renderForm()

    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: "90" },
    })
    fireEvent.click(screen.getByRole("button", { name: "USD" }))

    const charlieInput = screen.getByLabelText("Charlie share")
    fireEvent.change(charlieInput, { target: { value: "40" } })
    expect(charlieInput).toHaveValue("40")

    fireEvent.click(screen.getByRole("checkbox", { name: /charlie/i }))

    expect(charlieInput).toBeDisabled()
    expect(charlieInput).toHaveValue("")
  })

  it("shows equal-split summary when no overrides", () => {
    renderForm()

    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: "90" },
    })

    expect(screen.getByTestId("split-status")).toHaveTextContent(
      "3 people split USD 90.00 equally",
    )
  })

  it("shows remainder summary when one member is overridden", () => {
    renderForm()

    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: "500" },
    })
    fireEvent.click(screen.getByRole("button", { name: "USD" }))
    fireEvent.change(screen.getByLabelText("Bob share"), {
      target: { value: "300" },
    })

    expect(screen.getByTestId("split-status")).toHaveTextContent(
      "Remainder USD 200.00 split equally (2 people)",
    )
  })

  it("shows error and disables submit when percent exceeds 100", () => {
    const { onSubmit } = renderForm()

    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: "Dinner" },
    })
    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: "100" },
    })
    fireEvent.change(screen.getByLabelText("Bob share"), {
      target: { value: "150" },
    })

    const status = screen.getByTestId("split-status")
    expect(status).toHaveClass("text-destructive")
    expect(status).toHaveTextContent(/100 or less/i)
    expect(screen.getByRole("button", { name: /add expense/i })).toBeDisabled()

    fireEvent.click(screen.getByRole("button", { name: /add expense/i }))
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("shows error and disables submit when amounts exceed total", () => {
    const { onSubmit } = renderForm()

    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: "Dinner" },
    })
    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: "100" },
    })
    fireEvent.click(screen.getByRole("button", { name: "USD" }))
    fireEvent.change(screen.getByLabelText("Alice share"), {
      target: { value: "80" },
    })
    fireEvent.change(screen.getByLabelText("Bob share"), {
      target: { value: "80" },
    })

    const status = screen.getByTestId("split-status")
    expect(status).toHaveClass("text-destructive")
    expect(status).toHaveTextContent(/exceed/i)
    expect(screen.getByRole("button", { name: /add expense/i })).toBeDisabled()

    fireEvent.click(screen.getByRole("button", { name: /add expense/i }))
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it("shows payer-covers-rounding summary when all overridden with drift", () => {
    renderForm()

    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: "100" },
    })
    fireEvent.change(screen.getByLabelText("Alice share"), {
      target: { value: "33.33" },
    })
    fireEvent.change(screen.getByLabelText("Bob share"), {
      target: { value: "33.33" },
    })
    fireEvent.change(screen.getByLabelText("Charlie share"), {
      target: { value: "33.33" },
    })

    expect(screen.getByTestId("split-status")).toHaveTextContent(
      /alice covers USD 0\.01 rounding/i,
    )
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

    const status = screen.getByTestId("split-status")
    expect(status).toHaveClass("text-destructive")
    expect(status).toHaveTextContent(/at least one person/i)
    expect(screen.getByRole("button", { name: /add expense/i })).toBeDisabled()

    fireEvent.click(screen.getByRole("button", { name: /add expense/i }))

    expect(onSubmit).not.toHaveBeenCalled()
  })
})
