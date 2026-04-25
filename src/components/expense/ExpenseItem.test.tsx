import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { makeExpense } from "@/test-helpers"
import ExpenseItem from "./ExpenseItem"

const memberNames: Record<string, string> = {
  m1: "Alice",
  m2: "Bob",
  m3: "Carol",
  m4: "Dave",
  m5: "Eve",
  m6: "Frank",
}
const getMemberName = (id: string) => memberNames[id] ?? id

describe("ExpenseItem", () => {
  it("renders description and formatted amount", () => {
    render(
      <ExpenseItem
        expense={makeExpense({ description: "Pizza", amount: 42.5 })}
        currency="USD"
        getMemberName={getMemberName}
      />,
    )
    expect(screen.getByText("Pizza")).toBeInTheDocument()
    expect(screen.getByText("USD 42.50")).toBeInTheDocument()
  })

  it("formats created_at as 'MON D' uppercased", () => {
    render(
      <ExpenseItem
        expense={makeExpense({ created_at: "2026-03-15T12:00:00Z" })}
        currency="USD"
        getMemberName={getMemberName}
      />,
    )
    expect(screen.getByText("MAR 15")).toBeInTheDocument()
  })

  it("shows the payer's name", () => {
    render(
      <ExpenseItem
        expense={makeExpense({ paid_by: "m2" })}
        currency="USD"
        getMemberName={getMemberName}
      />,
    )
    expect(screen.getByText("Paid by Bob")).toBeInTheDocument()
  })

  it("falls back to id when payer is unknown", () => {
    render(
      <ExpenseItem
        expense={makeExpense({ paid_by: "ghost" })}
        currency="USD"
        getMemberName={getMemberName}
      />,
    )
    expect(screen.getByText("Paid by ghost")).toBeInTheDocument()
  })

  it("lists all split members in the screen-reader summary", () => {
    render(
      <ExpenseItem
        expense={makeExpense({ split_among: ["m1", "m2", "m3"] })}
        currency="USD"
        getMemberName={getMemberName}
      />,
    )
    expect(screen.getByText("Split: Alice, Bob, Carol")).toBeInTheDocument()
  })

  it("shows '+N' overflow when more than 4 members are in the split", () => {
    render(
      <ExpenseItem
        expense={makeExpense({
          split_among: ["m1", "m2", "m3", "m4", "m5", "m6"],
        })}
        currency="USD"
        getMemberName={getMemberName}
      />,
    )
    expect(screen.getByText("+2")).toBeInTheDocument()
  })

  it("does not show the overflow badge when split has 4 or fewer members", () => {
    render(
      <ExpenseItem
        expense={makeExpense({ split_among: ["m1", "m2", "m3", "m4"] })}
        currency="USD"
        getMemberName={getMemberName}
      />,
    )
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument()
  })

  it("respects the currency prop in the displayed amount", () => {
    render(
      <ExpenseItem
        expense={makeExpense({ amount: 100 })}
        currency="EUR"
        getMemberName={getMemberName}
      />,
    )
    expect(screen.getByText("EUR 100.00")).toBeInTheDocument()
  })
})
