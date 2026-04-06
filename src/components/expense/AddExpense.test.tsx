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

describe("AddExpense", () => {
  const onAdded = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders form with all fields", () => {
    render(
      <AddExpense groupId="group-1" members={mockMembers} onAdded={onAdded} />,
    )

    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/who paid/i)).toBeInTheDocument()
    expect(screen.getAllByText("Alice").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Bob").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Charlie").length).toBeGreaterThan(0)
    expect(
      screen.getByRole("button", { name: /add expense/i }),
    ).toBeInTheDocument()
  })

  it("shows split percentages for all checked members", () => {
    render(
      <AddExpense groupId="group-1" members={mockMembers} onAdded={onAdded} />,
    )

    // All 3 members checked by default → 33.3% each
    const percentages = screen.getAllByText("33.3%")
    expect(percentages).toHaveLength(3)
  })

  it("updates percentages when a member is unchecked", () => {
    render(
      <AddExpense groupId="group-1" members={mockMembers} onAdded={onAdded} />,
    )

    // Uncheck Charlie → 2 members → 50% each
    fireEvent.click(screen.getByRole("checkbox", { name: /charlie/i }))

    const percentages = screen.getAllByText("50%")
    expect(percentages).toHaveLength(2)

    expect(screen.queryByText("33.3%")).not.toBeInTheDocument()
  })

  it("submits expense to supabase and calls onAdded", async () => {
    const mockInsert = vi.fn().mockResolvedValue({ error: null })
    vi.mocked(supabase.from).mockReturnValue({
      insert: mockInsert,
    } as unknown as ReturnType<typeof supabase.from>)

    render(
      <AddExpense groupId="group-1" members={mockMembers} onAdded={onAdded} />,
    )

    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: "Dinner" },
    })
    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: "90" },
    })

    // Select "Bob" as payer via the native select
    fireEvent.change(screen.getByLabelText(/who paid/i), {
      target: { value: "member-2" },
    })

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
    render(
      <AddExpense groupId="group-1" members={mockMembers} onAdded={onAdded} />,
    )

    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: "50" },
    })

    fireEvent.click(screen.getByRole("button", { name: /add expense/i }))

    expect(supabase.from).not.toHaveBeenCalled()
  })

  it("does not submit if amount is zero", () => {
    render(
      <AddExpense groupId="group-1" members={mockMembers} onAdded={onAdded} />,
    )

    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: "Dinner" },
    })

    fireEvent.click(screen.getByRole("button", { name: /add expense/i }))

    expect(supabase.from).not.toHaveBeenCalled()
  })

  it("does not submit if no members are selected for split", () => {
    render(
      <AddExpense groupId="group-1" members={mockMembers} onAdded={onAdded} />,
    )

    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: "Dinner" },
    })
    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: "50" },
    })

    // Uncheck all members
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

    render(
      <AddExpense groupId="group-1" members={mockMembers} onAdded={onAdded} />,
    )

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
