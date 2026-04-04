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
    localStorage.clear()
    import.meta.env.VITE_ADMIN_PIN = "9999"
  })

  it("shows PIN prompt when not authorized", () => {
    render(
      <MemoryRouter>
        <CreateGroup />
      </MemoryRouter>,
    )

    expect(screen.getByLabelText(/enter pin/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/group name/i)).not.toBeInTheDocument()
  })

  it("shows error on wrong PIN", () => {
    render(
      <MemoryRouter>
        <CreateGroup />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText(/enter pin/i), {
      target: { value: "wrong" },
    })
    fireEvent.click(screen.getByRole("button", { name: /submit/i }))

    expect(screen.getByText(/incorrect pin/i)).toBeInTheDocument()
  })

  it("shows create form after correct PIN", () => {
    render(
      <MemoryRouter>
        <CreateGroup />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText(/enter pin/i), {
      target: { value: "9999" },
    })
    fireEvent.click(screen.getByRole("button", { name: /submit/i }))

    expect(screen.getByLabelText(/group name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/currency/i)).toBeInTheDocument()
    expect(localStorage.getItem("opensplit:admin_pin")).toBe("9999")
  })

  it("skips PIN prompt if already authorized in localStorage", () => {
    localStorage.setItem("opensplit:admin_pin", "9999")

    render(
      <MemoryRouter>
        <CreateGroup />
      </MemoryRouter>,
    )

    expect(screen.getByLabelText(/group name/i)).toBeInTheDocument()
  })

  it("creates group in supabase and navigates to it on submit", async () => {
    localStorage.setItem("opensplit:admin_pin", "9999")
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
      })
    })

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/groups/token-abc")
    })
  })

  it("does not submit if group name is empty", async () => {
    localStorage.setItem("opensplit:admin_pin", "9999")

    render(
      <MemoryRouter>
        <CreateGroup />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole("button", { name: /create group/i }))

    expect(supabase.from).not.toHaveBeenCalled()
  })
})
