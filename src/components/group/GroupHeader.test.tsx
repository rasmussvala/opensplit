import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { makeGroup, makeMember } from "@/test-helpers"
import GroupHeader from "./GroupHeader"

beforeEach(() => {
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  })
})

describe("GroupHeader", () => {
  it("renders the group name as a heading", () => {
    render(
      <GroupHeader
        group={makeGroup({ name: "Trip to Berlin" })}
        members={[makeMember()]}
        totalSpent={0}
      />,
    )
    expect(
      screen.getByRole("heading", { name: "Trip to Berlin" }),
    ).toBeInTheDocument()
  })

  it("renders total spent in the group's currency", () => {
    render(
      <GroupHeader
        group={makeGroup({ currency: "EUR" })}
        members={[makeMember()]}
        totalSpent={1234.5}
      />,
    )
    expect(screen.getByText("EUR 1 234.50")).toBeInTheDocument()
  })

  it("renders each member name", () => {
    render(
      <GroupHeader
        group={makeGroup()}
        members={[
          makeMember({ id: "m1", guest_name: "Alice" }),
          makeMember({ id: "m2", guest_name: "Bob" }),
        ]}
        totalSpent={0}
      />,
    )
    expect(screen.getByText("Alice")).toBeInTheDocument()
    expect(screen.getByText("Bob")).toBeInTheDocument()
  })

  it("renders the share-link button (InviteLink)", () => {
    render(
      <GroupHeader
        group={makeGroup({ invite_token: "abc-123" })}
        members={[makeMember()]}
        totalSpent={0}
      />,
    )
    expect(
      screen.getByRole("button", { name: /share link/i }),
    ).toBeInTheDocument()
  })

  it("renders children below the invite link", () => {
    render(
      <GroupHeader group={makeGroup()} members={[makeMember()]} totalSpent={0}>
        <div data-testid="extra">Extra content</div>
      </GroupHeader>,
    )
    expect(screen.getByTestId("extra")).toBeInTheDocument()
  })

  it("renders zero total when nothing has been spent", () => {
    render(
      <GroupHeader
        group={makeGroup({ currency: "USD" })}
        members={[makeMember()]}
        totalSpent={0}
      />,
    )
    expect(screen.getByText("USD 0.00")).toBeInTheDocument()
  })
})
