import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import JoinByCode from "./JoinByCode"

const navigate = vi.fn()

vi.mock("react-router-dom", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router-dom")>()),
  useNavigate: () => navigate,
}))

function renderJoinByCode() {
  return render(
    <MemoryRouter>
      <JoinByCode />
    </MemoryRouter>,
  )
}

describe("JoinByCode", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("navigates to the group route for the entered code", () => {
    renderJoinByCode()

    fireEvent.change(screen.getByLabelText(/group code/i), {
      target: { value: "abc-123" },
    })
    fireEvent.click(screen.getByRole("button", { name: /join group/i }))

    expect(navigate).toHaveBeenCalledWith("/groups/abc-123")
  })

  it("trims surrounding whitespace from the code", () => {
    renderJoinByCode()

    fireEvent.change(screen.getByLabelText(/group code/i), {
      target: { value: "  abc-123  " },
    })
    fireEvent.click(screen.getByRole("button", { name: /join group/i }))

    expect(navigate).toHaveBeenCalledWith("/groups/abc-123")
  })

  it("does not navigate when the code is empty", () => {
    renderJoinByCode()

    fireEvent.click(screen.getByRole("button", { name: /join group/i }))

    expect(navigate).not.toHaveBeenCalled()
  })
})
