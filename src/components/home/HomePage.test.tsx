import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { isMobileDevice, useStandalone } from "@/lib/useStandalone"
import HomePage from "./HomePage"

vi.mock("@/lib/useStandalone", () => ({
  useStandalone: vi.fn(),
  isMobileDevice: vi.fn(),
}))

function renderHome() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  )
}

describe("HomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows the app home on desktop", () => {
    vi.mocked(isMobileDevice).mockReturnValue(false)
    vi.mocked(useStandalone).mockReturnValue(false)

    renderHome()

    expect(screen.getByText("opensplit")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /admin/i })).toHaveAttribute(
      "href",
      "/admin",
    )
  })

  it("shows the app home when installed on mobile", () => {
    vi.mocked(isMobileDevice).mockReturnValue(true)
    vi.mocked(useStandalone).mockReturnValue(true)

    renderHome()

    expect(screen.getByText("opensplit")).toBeInTheDocument()
  })

  it("shows the install guide on mobile when not installed", () => {
    vi.mocked(isMobileDevice).mockReturnValue(true)
    vi.mocked(useStandalone).mockReturnValue(false)

    renderHome()

    expect(
      screen.getByText(/add opensplit to your home screen/i),
    ).toBeInTheDocument()
  })

  it("reveals the app home after 'Continue in browser'", () => {
    vi.mocked(isMobileDevice).mockReturnValue(true)
    vi.mocked(useStandalone).mockReturnValue(false)

    renderHome()

    fireEvent.click(
      screen.getByRole("button", { name: /continue in browser/i }),
    )

    expect(screen.getByText("opensplit")).toBeInTheDocument()
    expect(
      screen.queryByText(/add opensplit to your home screen/i),
    ).not.toBeInTheDocument()
  })
})
