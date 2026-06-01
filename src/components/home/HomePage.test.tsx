import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"
import HomePage from "./HomePage"

describe("HomePage", () => {
  it("renders the title and an admin link to /admin", () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(screen.getByText("opensplit")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /admin/i })).toHaveAttribute(
      "href",
      "/admin",
    )
  })
})
