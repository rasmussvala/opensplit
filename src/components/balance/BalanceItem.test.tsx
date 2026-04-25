import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import BalanceItem from "./BalanceItem"

describe("BalanceItem", () => {
  it("renders the member name", () => {
    render(
      <BalanceItem
        memberId="m1"
        name="Alice"
        balance={50}
        currency="USD"
        maxMagnitude={50}
      />,
    )
    expect(screen.getByText("Alice")).toBeInTheDocument()
  })

  it("uses positive styling and a + sign for credit balances", () => {
    render(
      <BalanceItem
        memberId="m1"
        name="Alice"
        balance={42.5}
        currency="USD"
        maxMagnitude={50}
      />,
    )
    expect(screen.getByText("+")).toBeInTheDocument()
    expect(screen.getByText("Alice: +USD 42.50")).toBeInTheDocument()
  })

  it("uses destructive styling and a − sign for debit balances", () => {
    render(
      <BalanceItem
        memberId="m2"
        name="Bob"
        balance={-30}
        currency="USD"
        maxMagnitude={50}
      />,
    )
    expect(screen.getByText("−")).toBeInTheDocument()
    expect(screen.getByText("Bob: -USD 30.00")).toBeInTheDocument()
  })

  it("renders amount split into currency code and number portions", () => {
    render(
      <BalanceItem
        memberId="m1"
        name="Alice"
        balance={1234.5}
        currency="EUR"
        maxMagnitude={1234.5}
      />,
    )
    expect(screen.getByText("EUR")).toBeInTheDocument()
    expect(screen.getByText("1 234.50")).toBeInTheDocument()
  })

  it("scales the bar width relative to maxMagnitude with a 4% floor", () => {
    const { container } = render(
      <BalanceItem
        memberId="m1"
        name="Alice"
        balance={1}
        currency="USD"
        maxMagnitude={1000}
      />,
    )
    const bar = container.querySelector("[style*='width']") as HTMLElement
    expect(bar.style.width).toBe("4%")
  })

  it("uses 0% bar width when maxMagnitude is 0", () => {
    const { container } = render(
      <BalanceItem
        memberId="m1"
        name="Alice"
        balance={0}
        currency="USD"
        maxMagnitude={0}
      />,
    )
    const bar = container.querySelector("[style*='width']") as HTMLElement
    expect(bar.style.width).toBe("0%")
  })

  it("tags the row with a member-id testid for parent queries", () => {
    render(
      <BalanceItem
        memberId="m-xyz"
        name="Alice"
        balance={10}
        currency="USD"
        maxMagnitude={10}
      />,
    )
    expect(screen.getByTestId("balance-m-xyz")).toBeInTheDocument()
  })
})
