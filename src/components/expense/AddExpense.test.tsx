import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { supabase } from "@/lib/supabase"
import type { DbGroupMember } from "@/lib/types"
import AddExpense from "./AddExpense"

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}))

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

function renderAddExpense(onAdded = vi.fn()) {
  render(
    <AddExpense
      groupId="group-1"
      members={mockMembers}
      currency="USD"
      onAdded={onAdded}
    />,
  )
  return { onAdded }
}

describe("AddExpense", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders form with all fields", () => {
    renderAddExpense()

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
    renderAddExpense()

    expect(
      screen.getByRole("button", { name: /paid by alice/i }),
    ).toHaveAttribute("aria-pressed", "true")
    expect(
      screen.getByRole("button", { name: /paid by bob/i }),
    ).toHaveAttribute("aria-pressed", "false")
  })

  it("checks all members for split by default", () => {
    renderAddExpense()

    for (const m of mockMembers) {
      expect(screen.getByRole("checkbox", { name: m.guest_name })).toBeChecked()
    }
  })

  it("toggles split membership when a member is unchecked", () => {
    renderAddExpense()

    fireEvent.click(screen.getByRole("checkbox", { name: /charlie/i }))

    expect(screen.getByRole("checkbox", { name: /charlie/i })).not.toBeChecked()
    expect(screen.getByRole("checkbox", { name: /alice/i })).toBeChecked()
    expect(screen.getByRole("checkbox", { name: /bob/i })).toBeChecked()
  })

  it("submits expense to supabase and calls onAdded", async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.from).mockReturnValue({
      insert: mockInsert,
    } as unknown as ReturnType<typeof supabase.from>)

    const { onAdded } = renderAddExpense()

    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: "Dinner" },
    })
    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: "90" },
    })
    fireEvent.click(screen.getByRole("button", { name: /paid by bob/i }))
    fireEvent.click(screen.getByRole("button", { name: /add expense/i }))

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("expenses")
      expect(mockInsert).toHaveBeenCalledWith({
        group_id: "group-1",
        description: "Dinner",
        amount: 90,
        paid_by: "member-2",
        split_among: ["member-1", "member-2", "member-3"],
      })
    })

    await waitFor(() => {
      expect(onAdded).toHaveBeenCalled()
    })
  })

  it("does not submit if description is empty", () => {
    renderAddExpense()

    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: "50" },
    })

    fireEvent.click(screen.getByRole("button", { name: /add expense/i }))

    expect(supabase.from).not.toHaveBeenCalled()
  })

  it("does not submit if amount is zero", () => {
    renderAddExpense()

    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: "Dinner" },
    })

    fireEvent.click(screen.getByRole("button", { name: /add expense/i }))

    expect(supabase.from).not.toHaveBeenCalled()
  })

  it("does not submit if no members are selected for split", () => {
    renderAddExpense()

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

    expect(supabase.from).not.toHaveBeenCalled()
  })

  it("resets form after successful submission", async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.from).mockReturnValue({
      insert: mockInsert,
    } as unknown as ReturnType<typeof supabase.from>)

    const { onAdded } = renderAddExpense()

    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: "Dinner" },
    })
    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: "90" },
    })

    fireEvent.click(screen.getByRole("button", { name: /add expense/i }))

    await waitFor(() => {
      expect(onAdded).toHaveBeenCalled()
    })

    expect(screen.getByLabelText(/description/i)).toHaveValue("")
    expect(screen.getByLabelText(/amount/i)).toHaveValue(null)
  })
})
