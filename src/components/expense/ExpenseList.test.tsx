import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { supabase } from "@/lib/supabase"
import type { DbExpense, DbGroupMember } from "@/lib/types"
import ExpenseList from "./ExpenseList"

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

describe("ExpenseList", () => {
  const onChanged = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders expense list with formatted amounts", () => {
    render(
      <ExpenseList
        expenses={mockExpenses}
        members={mockMembers}
        currency="USD"
        onChanged={onChanged}
      />,
    )

    expect(screen.getByText("Dinner")).toBeInTheDocument()
    expect(screen.getByText("USD 120.00")).toBeInTheDocument()
    expect(screen.getByText("Taxi")).toBeInTheDocument()
    expect(screen.getByText("USD 45.50")).toBeInTheDocument()
  })

  it("shows who paid each expense", () => {
    render(
      <ExpenseList
        expenses={mockExpenses}
        members={mockMembers}
        currency="USD"
        onChanged={onChanged}
      />,
    )

    // "Paid by Alice" and "Paid by Bob"
    expect(screen.getByText(/paid by alice/i)).toBeInTheDocument()
    expect(screen.getByText(/paid by bob/i)).toBeInTheDocument()
  })

  it("shows split among members", () => {
    render(
      <ExpenseList
        expenses={[mockExpenses[0]]}
        members={mockMembers}
        currency="USD"
        onChanged={onChanged}
      />,
    )

    expect(screen.getByText(/alice, bob/i)).toBeInTheDocument()
  })

  it("shows empty state when no expenses", () => {
    render(
      <ExpenseList
        expenses={[]}
        members={mockMembers}
        currency="USD"
        onChanged={onChanged}
      />,
    )

    expect(screen.getByText(/no expenses yet/i)).toBeInTheDocument()
  })

  it("deletes an expense and calls onChanged", async () => {
    const mockDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    vi.mocked(supabase.from).mockReturnValue({
      delete: mockDelete,
    } as unknown as ReturnType<typeof supabase.from>)

    render(
      <ExpenseList
        expenses={[mockExpenses[0]]}
        members={mockMembers}
        currency="USD"
        onChanged={onChanged}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /delete/i }))

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("expenses")
      expect(mockDelete).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(onChanged).toHaveBeenCalled()
    })
  })

  it("opens edit dialog with pre-filled values", () => {
    render(
      <ExpenseList
        expenses={[mockExpenses[0]]}
        members={mockMembers}
        currency="USD"
        onChanged={onChanged}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /edit/i }))

    expect(screen.getByDisplayValue("Dinner")).toBeInTheDocument()
    expect(screen.getByDisplayValue("120")).toBeInTheDocument()
  })

  it("saves edited expense and calls onChanged", async () => {
    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })
    vi.mocked(supabase.from).mockReturnValue({
      update: mockUpdate,
    } as unknown as ReturnType<typeof supabase.from>)

    render(
      <ExpenseList
        expenses={[mockExpenses[0]]}
        members={mockMembers}
        currency="USD"
        onChanged={onChanged}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /edit/i }))

    fireEvent.change(screen.getByDisplayValue("Dinner"), {
      target: { value: "Fancy Dinner" },
    })
    fireEvent.change(screen.getByDisplayValue("120"), {
      target: { value: "150" },
    })

    fireEvent.click(screen.getByRole("button", { name: /save/i }))

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("expenses")
      expect(mockUpdate).toHaveBeenCalledWith({
        description: "Fancy Dinner",
        amount: 150,
        paid_by: "member-1",
        split_among: ["member-1", "member-2"],
      })
    })

    await waitFor(() => {
      expect(onChanged).toHaveBeenCalled()
    })
  })
})
