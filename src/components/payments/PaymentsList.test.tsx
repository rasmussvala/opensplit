import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import type { DbGroupMember, DbSettlement } from "@/lib/types"
import PaymentsList from "./PaymentsList"

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

function renderPaymentsList(
  overrides: {
    settlements?: DbSettlement[]
    members?: DbGroupMember[]
    currency?: string
  } = {},
) {
  const props = {
    settlements: overrides.settlements ?? [],
    members: overrides.members ?? mockMembers,
    currency: overrides.currency ?? "USD",
  }
  return render(<PaymentsList {...props} />)
}

describe("PaymentsList", () => {
  it("shows empty state when there are no settlements", () => {
    renderPaymentsList()

    expect(screen.getByText(/no payments yet/i)).toBeInTheDocument()
  })

  it("renders one row per settlement", () => {
    const settlements: DbSettlement[] = [
      {
        id: "settlement-1",
        group_id: "group-1",
        from_member: "member-2",
        to_member: "member-1",
        amount: 50,
        settled_at: "2026-01-02T12:00:00Z",
      },
      {
        id: "settlement-2",
        group_id: "group-1",
        from_member: "member-3",
        to_member: "member-1",
        amount: 30,
        settled_at: "2026-01-03T12:00:00Z",
      },
    ]

    renderPaymentsList({ settlements })

    expect(screen.getByText(/bob paid alice USD 50\.00/i)).toBeInTheDocument()
    expect(
      screen.getByText(/charlie paid alice USD 30\.00/i),
    ).toBeInTheDocument()
  })

  it("orders rows by settled_at descending", () => {
    const settlements: DbSettlement[] = [
      {
        id: "settlement-old",
        group_id: "group-1",
        from_member: "member-2",
        to_member: "member-1",
        amount: 10,
        settled_at: "2026-01-01T12:00:00Z",
      },
      {
        id: "settlement-new",
        group_id: "group-1",
        from_member: "member-3",
        to_member: "member-1",
        amount: 20,
        settled_at: "2026-02-15T12:00:00Z",
      },
    ]

    const { container } = renderPaymentsList({ settlements })
    const rows = within(container).getAllByText(/paid .* on /i)

    expect(rows[0]).toHaveTextContent(/charlie paid alice USD 20\.00/i)
    expect(rows[1]).toHaveTextContent(/bob paid alice USD 10\.00/i)
  })

  it("renders the formatted amount, names and date label", () => {
    const settlements: DbSettlement[] = [
      {
        id: "settlement-1",
        group_id: "group-1",
        from_member: "member-2",
        to_member: "member-1",
        amount: 50,
        settled_at: "2026-03-04T12:00:00Z",
      },
    ]

    renderPaymentsList({ settlements })

    expect(screen.getByText("USD")).toBeInTheDocument()
    expect(screen.getByText("50.00")).toBeInTheDocument()
    expect(screen.getByText("MAR 4")).toBeInTheDocument()
    expect(
      screen.getByText(/bob paid alice USD 50\.00 on MAR 4/i),
    ).toBeInTheDocument()
  })
})
