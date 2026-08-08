import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { Group, Member } from "@/application/groups/loadGroupSnapshot"
import GroupHeader from "./GroupHeader"

const group: Group = {
  id: "g1",
  name: "Test Group",
  currency: "USD",
  inviteToken: "invite-abc",
}

const member: Member = {
  id: "m1",
  name: "Alice",
  userId: "u1",
  swishPhone: null,
}

beforeEach(() => {
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  })
})

describe("GroupHeader", () => {
  it("renders the group name as a heading", () => {
    render(
      <GroupHeader
        group={{ ...group, name: "Trip to Berlin" }}
        members={[member]}
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
        group={{ ...group, currency: "EUR" }}
        members={[member]}
        totalSpent={1234.5}
      />,
    )
    expect(screen.getByText("EUR 1 234.50")).toBeInTheDocument()
  })

  it("renders each member name", () => {
    render(
      <GroupHeader
        group={group}
        members={[member, { ...member, id: "m2", name: "Bob" }]}
        totalSpent={0}
      />,
    )
    expect(screen.getByText("Alice")).toBeInTheDocument()
    expect(screen.getByText("Bob")).toBeInTheDocument()
  })

  it("renders the copy code button (InviteCode)", () => {
    render(
      <GroupHeader
        group={{ ...group, inviteToken: "abc-123" }}
        members={[member]}
        totalSpent={0}
      />,
    )
    expect(
      screen.getByRole("button", { name: /copy code/i }),
    ).toBeInTheDocument()
  })

  it("renders children below the invite code", () => {
    render(
      <GroupHeader group={group} members={[member]} totalSpent={0}>
        <div data-testid="extra">Extra content</div>
      </GroupHeader>,
    )
    expect(screen.getByTestId("extra")).toBeInTheDocument()
  })

  it("renders zero total when nothing has been spent", () => {
    render(<GroupHeader group={group} members={[member]} totalSpent={0} />)
    expect(screen.getByText("USD 0.00")).toBeInTheDocument()
  })
})
