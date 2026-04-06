import { fireEvent, render, screen } from "@testing-library/react"
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
  it("shows a heading with member count", () => {
    render(<MemberList members={members} />)

    expect(
      screen.getByRole("heading", { name: /members/i }),
    ).toBeInTheDocument()
    expect(screen.getByText(/2/)).toBeInTheDocument()
  })

  it("is collapsed by default", () => {
    render(<MemberList members={members} />)

    expect(screen.queryByText("Alice")).not.toBeInTheDocument()
    expect(screen.queryByText("Bob")).not.toBeInTheDocument()
  })

  it("expands to show members when clicked", () => {
    render(<MemberList members={members} />)

    fireEvent.click(screen.getByRole("button"))

    expect(screen.getByText("Alice")).toBeInTheDocument()
    expect(screen.getByText("Bob")).toBeInTheDocument()
  })

  it("collapses again when clicked twice", () => {
    render(<MemberList members={members} />)

    const toggle = screen.getByRole("button")
    fireEvent.click(toggle)
    fireEvent.click(toggle)

    expect(screen.queryByText("Alice")).not.toBeInTheDocument()
  })
})
