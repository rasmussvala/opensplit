import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { describe, expect, it, vi } from "vitest"
import AdminPage from "./AdminPage"

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }),
  },
}))

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({ userId: "test-user-id" }),
}))

describe("AdminPage", () => {
  it("renders create group form and groups section", async () => {
    render(
      <MemoryRouter>
        <AdminPage />
      </MemoryRouter>,
    )

    expect(screen.getByText(/create a group/i)).toBeInTheDocument()
    expect(screen.getByText(/existing groups/i)).toBeInTheDocument()

    // Let the embedded GroupList finish its fetch so updates land inside act.
    await screen.findByText(/no groups yet/i)
  })
})
