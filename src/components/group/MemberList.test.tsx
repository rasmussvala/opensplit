import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import type { Member } from "@/application/groups/loadGroupSnapshot"
import MemberList from "./MemberList"

const members: Member[] = [
  {
    id: "m1",
    name: "Alice",
    userId: "u1",
    swishPhone: null,
  },
  {
    id: "m2",
    name: "Bob",
    userId: "u2",
    swishPhone: null,
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
