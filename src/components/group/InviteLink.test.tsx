import { fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import InviteLink from "./InviteLink"

describe("InviteLink", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
  })

  it("renders a share link button", () => {
    render(<InviteLink inviteToken="abc-123" />)

    expect(
      screen.getByRole("button", { name: /share link/i }),
    ).toBeInTheDocument()
  })

  it("copies the invite URL on button click", async () => {
    render(<InviteLink inviteToken="abc-123" />)

    fireEvent.click(screen.getByRole("button", { name: /share link/i }))

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining("groups/abc-123"),
    )
  })

  it("shows copied feedback after click", async () => {
    render(<InviteLink inviteToken="abc-123" />)

    fireEvent.click(screen.getByRole("button", { name: /share link/i }))

    expect(await screen.findByText(/copied/i)).toBeInTheDocument()
  })
})
