import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { isMobileDevice, useStandalone } from "@/lib/useStandalone"
import HomePage from "./HomePage"

vi.mock("@/lib/useStandalone", () => ({
  useStandalone: vi.fn(),
  isMobileDevice: vi.fn(),
  getMobilePlatform: vi.fn(() => "ios"),
}))

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({ userId: "test-user-id" }),
}))

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
  },
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

  it("shows the app home on desktop", async () => {
    vi.mocked(isMobileDevice).mockReturnValue(false)
    vi.mocked(useStandalone).mockReturnValue(false)

    renderHome()

    expect(screen.getByText("opensplit")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /admin/i })).toHaveAttribute(
      "href",
      "/admin",
    )
    await screen.findByText(/haven't joined any groups/i)
  })

  it("shows the app home when installed on mobile", async () => {
    vi.mocked(isMobileDevice).mockReturnValue(true)
    vi.mocked(useStandalone).mockReturnValue(true)

    renderHome()

    expect(screen.getByText("opensplit")).toBeInTheDocument()
    await screen.findByText(/haven't joined any groups/i)
  })

  it("shows the install guide on mobile when not installed", () => {
    vi.mocked(isMobileDevice).mockReturnValue(true)
    vi.mocked(useStandalone).mockReturnValue(false)

    renderHome()

    expect(screen.getByText(/install opensplit/i)).toBeInTheDocument()
  })

  it("reveals the app home after 'Continue in browser'", async () => {
    vi.mocked(isMobileDevice).mockReturnValue(true)
    vi.mocked(useStandalone).mockReturnValue(false)

    renderHome()

    fireEvent.click(
      screen.getByRole("button", { name: /continue in browser/i }),
    )

    expect(screen.getByText("opensplit")).toBeInTheDocument()
    expect(screen.queryByText(/install opensplit/i)).not.toBeInTheDocument()
    await screen.findByText(/haven't joined any groups/i)
  })
})
