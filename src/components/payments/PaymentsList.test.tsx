import { render, screen, within } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"
import type {
  Settlement as DomainSettlement,
  Member,
} from "@/application/groups/loadGroupSnapshot"
import PaymentsList from "./PaymentsList"

type Settlement = DomainSettlement & { groupId: string }

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
  {
    id: "member-3",
    name: "Charlie",
    userId: "user-3",
    swishPhone: null,
  },
]

function renderPaymentsList(
  overrides: {
    settlements?: Settlement[]
    members?: Member[]
    currency?: string
    inviteToken?: string
  } = {},
) {
  const props = {
    settlements: overrides.settlements ?? [],
    members: overrides.members ?? mockMembers,
    currency: overrides.currency ?? "USD",
    inviteToken: overrides.inviteToken ?? "token-abc",
  }
  return render(
    <MemoryRouter>
      <PaymentsList {...props} />
    </MemoryRouter>,
  )
}

describe("PaymentsList", () => {
  it("shows empty state when there are no settlements", () => {
    renderPaymentsList()

    expect(screen.getByText(/no payments yet/i)).toBeInTheDocument()
  })

  it("renders one row per settlement", () => {
    const settlements: Settlement[] = [
      {
        id: "settlement-1",
        groupId: "group-1",
        from: "member-2",
        to: "member-1",
        amount: 50,
        settledAt: "2026-01-02T12:00:00Z",
      },
      {
        id: "settlement-2",
        groupId: "group-1",
        from: "member-3",
        to: "member-1",
        amount: 30,
        settledAt: "2026-01-03T12:00:00Z",
      },
    ]

    renderPaymentsList({ settlements })

    expect(screen.getByText(/bob paid alice USD 50\.00/i)).toBeInTheDocument()
    expect(
      screen.getByText(/charlie paid alice USD 30\.00/i),
    ).toBeInTheDocument()
  })

  it("orders rows by settledAt descending", () => {
    const settlements: Settlement[] = [
      {
        id: "settlement-old",
        groupId: "group-1",
        from: "member-2",
        to: "member-1",
        amount: 10,
        settledAt: "2026-01-01T12:00:00Z",
      },
      {
        id: "settlement-new",
        groupId: "group-1",
        from: "member-3",
        to: "member-1",
        amount: 20,
        settledAt: "2026-02-15T12:00:00Z",
      },
    ]

    const { container } = renderPaymentsList({ settlements })
    const rows = within(container).getAllByText(/paid .* on /i)

    expect(rows[0]).toHaveTextContent(/charlie paid alice USD 20\.00/i)
    expect(rows[1]).toHaveTextContent(/bob paid alice USD 10\.00/i)
  })

  it("renders the formatted amount, names and date label", () => {
    const settlements: Settlement[] = [
      {
        id: "settlement-1",
        groupId: "group-1",
        from: "member-2",
        to: "member-1",
        amount: 50,
        settledAt: "2026-03-04T12:00:00Z",
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

  it("renders each settlement as a link to its edit page", () => {
    const settlements: Settlement[] = [
      {
        id: "settlement-1",
        groupId: "group-1",
        from: "member-2",
        to: "member-1",
        amount: 50,
        settledAt: "2026-03-04T12:00:00Z",
      },
      {
        id: "settlement-2",
        groupId: "group-1",
        from: "member-3",
        to: "member-1",
        amount: 30,
        settledAt: "2026-03-05T12:00:00Z",
      },
    ]

    renderPaymentsList({ settlements, inviteToken: "token-abc" })

    const links = screen.getAllByRole("link")
    expect(links).toHaveLength(2)
    expect(links[0]).toHaveAttribute(
      "href",
      "/groups/token-abc/settlements/settlement-2",
    )
    expect(links[1]).toHaveAttribute(
      "href",
      "/groups/token-abc/settlements/settlement-1",
    )
  })
})
