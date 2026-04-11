import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import type { DbGroupMember } from "@/lib/types"
import MemberList from "./MemberList"

const members: DbGroupMember[] = [
  {
    id: "m1",
    group_id: "g1",
    guest_name: "Alice",
    user_id: "u1",
    joined_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "m2",
    group_id: "g1",
    guest_name: "Bob",
    user_id: "u2",
    joined_at: "2026-01-02T00:00:00Z",
  },
]

describe("MemberList", () => {
  it("renders name and avatar for each member", () => {
    render(<MemberList members={members} />)

    expect(screen.getByText("Alice")).toBeInTheDocument()
    expect(screen.getByText("Bob")).toBeInTheDocument()
    expect(screen.getByText("A")).toBeInTheDocument()
    expect(screen.getByText("B")).toBeInTheDocument()
  })

  it("renders nothing for empty members list", () => {
    const { container } = render(<MemberList members={[]} />)

    expect(container.children[0].children).toHaveLength(0)
  })
})
