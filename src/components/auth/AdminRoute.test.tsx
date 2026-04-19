import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import AdminRoute from "../auth/AdminRoute"

vi.mock("@/lib/shared-storage", () => ({
  loadLastGroup: vi.fn(),
}))

import { loadLastGroup } from "@/lib/shared-storage"

function renderAdminRoute() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route element={<AdminRoute />}>
          <Route index element={<p>child content</p>} />
        </Route>
        <Route path="/groups/:inviteToken" element={<p>group page</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe("AdminRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    import.meta.env.VITE_ADMIN_PIN = "9999"
    vi.mocked(loadLastGroup).mockResolvedValue(null)
  })

  it("shows PIN prompt when not authorized and no cached group", async () => {
    renderAdminRoute()

    expect(await screen.findByLabelText(/enter pin/i)).toBeInTheDocument()
    expect(screen.queryByText("child content")).not.toBeInTheDocument()
  })

  it("shows error on wrong PIN", async () => {
    renderAdminRoute()

    fireEvent.change(await screen.findByLabelText(/enter pin/i), {
      target: { value: "wrong" },
    })
    fireEvent.click(screen.getByRole("button", { name: /submit/i }))

    expect(screen.getByText(/incorrect pin/i)).toBeInTheDocument()
  })

  it("renders child route after correct PIN", async () => {
    renderAdminRoute()

    fireEvent.change(await screen.findByLabelText(/enter pin/i), {
      target: { value: "9999" },
    })
    fireEvent.click(screen.getByRole("button", { name: /submit/i }))

    expect(screen.getByText("child content")).toBeInTheDocument()
    expect(localStorage.getItem("opensplit:admin_pin")).toBe("9999")
  })

  it("skips PIN prompt if already authorized in localStorage", () => {
    localStorage.setItem("opensplit:admin_pin", "9999")

    renderAdminRoute()

    expect(screen.getByText("child content")).toBeInTheDocument()
  })

  it("redirects to last group when unauthorized and cache has token", async () => {
    vi.mocked(loadLastGroup).mockResolvedValue("token-xyz")

    renderAdminRoute()

    await waitFor(() => {
      expect(screen.getByText("group page")).toBeInTheDocument()
    })
    expect(screen.queryByLabelText(/enter pin/i)).not.toBeInTheDocument()
  })
})
