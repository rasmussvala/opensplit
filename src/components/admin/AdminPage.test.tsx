import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"
import AdminPage from "./AdminPage"

vi.mock("@/lib/supabase", () => ({
  supabase: { from: vi.fn() },
}))

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({ userId: "test-user-id" }),
}))

describe("AdminPage", () => {
  it("renders the create group form and no list of groups", async () => {
    render(
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>,
    )

    expect(screen.getByText(/create a group/i)).toBeInTheDocument()
    expect(screen.queryByText(/existing groups/i)).not.toBeInTheDocument()
  })
})
