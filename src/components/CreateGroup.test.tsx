import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { supabase } from "@/lib/supabase"
import CreateGroup from "./CreateGroup"

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}))

vi.mock("@/components/AuthProvider", () => ({
  useAuth: () => ({ userId: "test-user-id" }),
}))

const mockNavigate = vi.fn()
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom")
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe("CreateGroup", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders form with name and currency inputs", () => {
    render(
      <MemoryRouter>
        <CreateGroup />
      </MemoryRouter>,
    )

    expect(screen.getByLabelText(/group name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/currency/i)).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /create group/i }),
    ).toBeInTheDocument()
  })

  it("creates group in supabase and navigates to it on submit", async () => {
    const mockGroup = { id: "group-uuid", invite_token: "token-abc" }

    const mockInsertGroup = {
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockGroup, error: null }),
        }),
      }),
    }

    vi.mocked(supabase.from).mockReturnValue(
      mockInsertGroup as unknown as ReturnType<typeof supabase.from>,
    )

    render(
      <MemoryRouter>
        <CreateGroup />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText(/group name/i), {
      target: { value: "Trip to Oslo" },
    })

    fireEvent.click(screen.getByRole("button", { name: /create group/i }))

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("groups")
      expect(mockInsertGroup.insert).toHaveBeenCalledWith({
        name: "Trip to Oslo",
        currency: "USD",
        created_by: "test-user-id",
      })
    })

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/groups/token-abc")
    })
  })

  it("does not submit if group name is empty", async () => {
    render(
      <MemoryRouter>
        <CreateGroup />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole("button", { name: /create group/i }))

    expect(supabase.from).not.toHaveBeenCalled()
  })
})
