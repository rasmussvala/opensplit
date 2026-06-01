import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it } from "vitest"
import BackButton from "./BackButton"

describe("BackButton", () => {
  it("links to home by default", () => {
    render(
      <MemoryRouter>
        <BackButton />
      </MemoryRouter>,
    )
    expect(screen.getByRole("link", { name: /back/i })).toHaveAttribute(
      "href",
      "/",
    )
  })

  it("honors a custom target and label", () => {
    render(
      <MemoryRouter>
        <BackButton to="/groups/abc" label="Back to group" />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole("link", { name: /back to group/i }),
    ).toHaveAttribute("href", "/groups/abc")
  })
})
