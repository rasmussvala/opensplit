import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import * as sharedStorage from "@/lib/shared-storage"
import AdminRoute from "../auth/AdminRoute"

vi.mock("@/lib/shared-storage", () => ({
  loadLastGroup: vi.fn(),
}))

function renderAdminRoute() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route element={<AdminRoute />}>
          <Route index element={<p>child content</p>} />
        </Route>
        <Route path="/groups/:token" element={<p>group page</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe("AdminRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    import.meta.env.VITE_ADMIN_PIN = "9999"
    vi.mocked(sharedStorage.loadLastGroup).mockResolvedValue(null)
  })

  it("shows PIN prompt when not authorized", async () => {
    renderAdminRoute()

    await waitFor(() => {
      expect(screen.getByLabelText(/enter pin/i)).toBeInTheDocument()
    })
    expect(screen.queryByText("child content")).not.toBeInTheDocument()
  })

  it("shows error on wrong PIN", async () => {
    renderAdminRoute()

    await waitFor(() => {
      expect(screen.getByLabelText(/enter pin/i)).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/enter pin/i), {
      target: { value: "wrong" },
    })
    fireEvent.click(screen.getByRole("button", { name: /submit/i }))

    expect(screen.getByText(/incorrect pin/i)).toBeInTheDocument()
  })

  it("renders child route after correct PIN", async () => {
    renderAdminRoute()

    await waitFor(() => {
      expect(screen.getByLabelText(/enter pin/i)).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText(/enter pin/i), {
      target: { value: "9999" },
    })
    fireEvent.click(screen.getByRole("button", { name: /submit/i }))

    expect(screen.getByText("child content")).toBeInTheDocument()
    expect(localStorage.getItem("opensplit:admin_pin")).toBe("9999")
  })

  it("skips PIN prompt if already authorized in localStorage", async () => {
    localStorage.setItem("opensplit:admin_pin", "9999")

    renderAdminRoute()

    expect(screen.getByText("child content")).toBeInTheDocument()
  })

  it("redirects non-admin to cached last group", async () => {
    vi.mocked(sharedStorage.loadLastGroup).mockResolvedValue("invite-abc-123")

    renderAdminRoute()

    await waitFor(() => {
      expect(screen.getByText("group page")).toBeInTheDocument()
    })
  })

  it("shows PIN prompt when no cached group and not admin", async () => {
    vi.mocked(sharedStorage.loadLastGroup).mockResolvedValue(null)

    renderAdminRoute()

    await waitFor(() => {
      expect(screen.getByLabelText(/enter pin/i)).toBeInTheDocument()
    })
  })
})
