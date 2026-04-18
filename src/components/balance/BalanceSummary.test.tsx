import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
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
    onSettle?: (from: string, to: string, amount: number) => Promise<void>
  } = {},
) {
  const props = {
    expenses: overrides.expenses ?? [],
    settlements: overrides.settlements ?? [],
    members: overrides.members ?? mockMembers,
    currency: overrides.currency ?? "USD",
    onSettle: overrides.onSettle ?? vi.fn(),
  }
  return render(<BalanceSummary {...props} />)
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
        created_at: "2026-01-01T12:00:00Z",
      },
    ]

    renderBalanceSummary({ expenses })

    expect(screen.getByText(/bob owes alice USD 50\.00/i)).toBeInTheDocument()
  })

  it("renders settle button per transaction", () => {
    const expenses: DbExpense[] = [
      {
        id: "expense-1",
        group_id: "group-1",
        paid_by: "member-1",
        amount: 120,
        description: "Dinner",
        split_among: ["member-1", "member-2", "member-3"],
        created_at: "2026-01-01T12:00:00Z",
      },
    ]

    renderBalanceSummary({ expenses })

    const settleButtons = screen.getAllByRole("button", { name: /settle/i })
    expect(settleButtons.length).toBe(2)
  })

  it("calls onSettle with correct args when settle is clicked", async () => {
    const onSettle = vi.fn().mockResolvedValue(undefined)
    const expenses: DbExpense[] = [
      {
        id: "expense-1",
        group_id: "group-1",
        paid_by: "member-1",
        amount: 100,
        description: "Dinner",
        split_among: ["member-1", "member-2"],
        created_at: "2026-01-01T12:00:00Z",
      },
    ]

    renderBalanceSummary({ expenses, onSettle })

    const settleButton = screen.getByRole("button", { name: /settle/i })
    fireEvent.click(settleButton)

    await waitFor(() => {
      expect(onSettle).toHaveBeenCalledWith("member-2", "member-1", 50)
    })
  })

  it("disables settle button while settling", async () => {
    let resolveSettle!: () => void
    const onSettle = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSettle = resolve
        }),
    )
    const expenses: DbExpense[] = [
      {
        id: "expense-1",
        group_id: "group-1",
        paid_by: "member-1",
        amount: 100,
        description: "Dinner",
        split_among: ["member-1", "member-2"],
        created_at: "2026-01-01T12:00:00Z",
      },
    ]

    renderBalanceSummary({ expenses, onSettle })

    const settleButton = screen.getByRole("button", { name: /settle/i })
    fireEvent.click(settleButton)

    await waitFor(() => {
      expect(settleButton).toBeDisabled()
    })

    resolveSettle()

    await waitFor(() => {
      expect(settleButton).not.toBeDisabled()
    })
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
