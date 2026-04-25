import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import BalanceList from "./BalanceList"

const memberNames = new Map([
  ["m1", "Alice"],
  ["m2", "Bob"],
  ["m3", "Carol"],
])

describe("BalanceList", () => {
  it("renders nothing when there are no balances", () => {
    const { container } = render(
      <BalanceList balances={{}} memberNames={memberNames} currency="USD" />,
    )
    expect(container.firstChild).toBeNull()
  })

  it("renders nothing when all balances are below the 0.01 threshold", () => {
    const { container } = render(
      <BalanceList
        balances={{ m1: 0.005, m2: -0.005 }}
        memberNames={memberNames}
        currency="USD"
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it("renders only members with non-trivial balances", () => {
    render(
      <BalanceList
        balances={{ m1: 50, m2: -50, m3: 0.001 }}
        memberNames={memberNames}
        currency="USD"
      />,
    )
    expect(screen.getByTestId("balance-m1")).toBeInTheDocument()
    expect(screen.getByTestId("balance-m2")).toBeInTheDocument()
    expect(screen.queryByTestId("balance-m3")).not.toBeInTheDocument()
  })

  it("sorts balances from highest credit to highest debit", () => {
    render(
      <BalanceList
        balances={{ m1: -30, m2: 75, m3: 10 }}
        memberNames={memberNames}
        currency="USD"
      />,
    )
    const rows = screen.getAllByTestId(/^balance-/)
    expect(rows.map((r) => r.dataset.testid)).toEqual([
      "balance-m2",
      "balance-m3",
      "balance-m1",
    ])
  })

  it("falls back to the member id when the name is missing", () => {
    render(
      <BalanceList
        balances={{ "missing-id": 25 }}
        memberNames={memberNames}
        currency="USD"
      />,
    )
    expect(screen.getByText("missing-id")).toBeInTheDocument()
  })

  it("renders the section heading", () => {
    render(
      <BalanceList
        balances={{ m1: 5, m2: -5 }}
        memberNames={memberNames}
        currency="USD"
      />,
    )
    expect(
      screen.getByRole("heading", { name: "Balances" }),
    ).toBeInTheDocument()
  })
})
