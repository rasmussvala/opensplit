import { fireEvent, render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import AdminRoute from "./AdminRoute"

function renderAdminRoute() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route element={<AdminRoute />}>
          <Route index element={<p>child content</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe("AdminRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    import.meta.env.VITE_ADMIN_PIN = "9999"
  })

  it("shows PIN prompt when not authorized", () => {
    renderAdminRoute()

    expect(screen.getByLabelText(/enter pin/i)).toBeInTheDocument()
    expect(screen.queryByText("child content")).not.toBeInTheDocument()
  })

  it("shows error on wrong PIN", () => {
    renderAdminRoute()

    fireEvent.change(screen.getByLabelText(/enter pin/i), {
      target: { value: "wrong" },
    })
    fireEvent.click(screen.getByRole("button", { name: /submit/i }))

    expect(screen.getByText(/incorrect pin/i)).toBeInTheDocument()
  })

  it("renders child route after correct PIN", () => {
    renderAdminRoute()

    fireEvent.change(screen.getByLabelText(/enter pin/i), {
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
})
