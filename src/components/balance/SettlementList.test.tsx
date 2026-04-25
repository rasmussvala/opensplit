import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { Transaction } from "@/lib/simplify"
import SettlementList from "./SettlementList"

const memberNames = new Map([
  ["m1", "Alice"],
  ["m2", "Bob"],
])

function renderWith(
  transactions: Transaction[],
  onSettle = vi.fn().mockResolvedValue(undefined),
) {
  render(
    <SettlementList
      transactions={transactions}
      memberNames={memberNames}
      currency="USD"
      onSettle={onSettle}
    />,
  )
  return { onSettle }
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

  it("invokes onSettle with the from/to/amount when the button is clicked", async () => {
    const { onSettle } = renderWith([{ from: "m2", to: "m1", amount: 25 }])
    fireEvent.click(screen.getByRole("button", { name: /settle/i }))
    await waitFor(() => expect(onSettle).toHaveBeenCalledWith("m2", "m1", 25))
  })

  it("disables the settle button while the promise is pending", async () => {
    let resolveSettle: () => void = () => {}
    const onSettle = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSettle = resolve
        }),
    )
    renderWith([{ from: "m2", to: "m1", amount: 25 }], onSettle)

    const button = screen.getByRole("button", { name: /settle/i })
    fireEvent.click(button)
    await waitFor(() => expect(button).toBeDisabled())

    resolveSettle()
    await waitFor(() => expect(button).not.toBeDisabled())
  })

  it("renders one row per transaction", () => {
    renderWith([
      { from: "m2", to: "m1", amount: 25 },
      { from: "m1", to: "m2", amount: 10 },
    ])
    expect(screen.getAllByRole("button", { name: /settle/i })).toHaveLength(2)
  })
})
