import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"
import type { Transaction } from "@/lib/simplify"
import SettlementList from "./SettlementList"

const memberNames = new Map([
  ["m1", "Alice"],
  ["m2", "Bob"],
])

function renderWith(transactions: Transaction[], inviteToken = "abc") {
  return render(
    <MemoryRouter>
      <SettlementList
        transactions={transactions}
        memberNames={memberNames}
        currency="USD"
        inviteToken={inviteToken}
      />
    </MemoryRouter>,
  )
}

describe("SettlementList", () => {
  it("renders the section heading", () => {
    renderWith([])
    expect(
      screen.getByRole("heading", { name: "Settlements" }),
    ).toBeInTheDocument()
  })

  it("renders an accessible 'X owes Y' label per transaction", () => {
    renderWith([{ from: "m2", to: "m1", amount: 25 }])
    expect(screen.getByText("Bob owes Alice USD 25.00")).toBeInTheDocument()
  })

  it("falls back to the member id when names are missing", () => {
    renderWith([{ from: "unknown-1", to: "unknown-2", amount: 10 }])
    expect(
      screen.getByText("unknown-1 owes unknown-2 USD 10.00"),
    ).toBeInTheDocument()
  })

  it("links each row to the settle page for that pair", () => {
    renderWith([{ from: "m2", to: "m1", amount: 25 }], "token-xyz")
    const link = screen.getByRole("link", { name: /bob owes alice/i })
    expect(link).toHaveAttribute("href", "/groups/token-xyz/settle/m2/m1")
  })

  it("renders one row per transaction", () => {
    renderWith([
      { from: "m2", to: "m1", amount: 25 },
      { from: "m1", to: "m2", amount: 10 },
    ])
    expect(screen.getAllByRole("link")).toHaveLength(2)
  })
})
