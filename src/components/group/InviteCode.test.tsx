import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import InviteCode from "./InviteCode"

describe("InviteCode", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
  })

  it("renders a copy code button", () => {
    render(<InviteCode inviteToken="abc-123" />)

    expect(
      screen.getByRole("button", { name: /copy code/i }),
    ).toBeInTheDocument()
  })

  it("copies the bare code (not a URL) on button click", async () => {
    render(<InviteCode inviteToken="abc-123" />)

    fireEvent.click(screen.getByRole("button", { name: /copy code/i }))

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("abc-123")
    })
  })

  it("shows copied feedback after click", async () => {
    render(<InviteCode inviteToken="abc-123" />)

    fireEvent.click(screen.getByRole("button", { name: /copy code/i }))

    expect(await screen.findByText(/copied/i)).toBeInTheDocument()
  })
})
