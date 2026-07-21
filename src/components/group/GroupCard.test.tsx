import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"
import { makeGroup, makeMember } from "@/test-helpers"
import GroupCard from "./GroupCard"

function renderCard(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe("GroupCard", () => {
  it("keeps the compact currency card when no home summary is supplied", () => {
    renderCard(<GroupCard group={makeGroup({ currency: "EUR" })} />)

    expect(screen.getByText("EUR")).toBeInTheDocument()
    expect(screen.queryByText(/spent/)).not.toBeInTheDocument()
  })

  it("renders the total, member count, and member preview", () => {
    const members = [
      makeMember({ id: "m1", guest_name: "Ada" }),
      makeMember({ id: "m2", guest_name: "Mina" }),
      makeMember({ id: "m3", guest_name: "Jo" }),
      makeMember({ id: "m4", guest_name: "Sam" }),
    ]

    renderCard(
      <GroupCard
        group={makeGroup({ name: "Summer trip", currency: "SEK" })}
        memberCount={4}
        members={members}
        totalSpent={12450}
      />,
    )

    expect(screen.getByText("4 members")).toBeInTheDocument()
    expect(screen.getByText("S")).toBeInTheDocument()
    expect(screen.getByRole("link")).toHaveAccessibleName(
      "Summer trip, SEK 12 450.00 spent, 4 members",
    )
  })
})
