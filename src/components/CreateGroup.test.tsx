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
  })

  it("renders form with name, currency, and member inputs", () => {
    render(
      <MemoryRouter>
        <CreateGroup />
      </MemoryRouter>,
    )

    expect(screen.getByLabelText(/group name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/currency/i)).toBeInTheDocument()
    expect(screen.getAllByPlaceholderText(/member name/i)).toHaveLength(2)
    expect(
      screen.getByRole("button", { name: /create group/i }),
    ).toBeInTheDocument()
  })

  it("can add more member fields", () => {
    render(
      <MemoryRouter>
        <CreateGroup />
      </MemoryRouter>,
    )

    fireEvent.click(screen.getByRole("button", { name: /add member/i }))

    expect(screen.getAllByPlaceholderText(/member name/i)).toHaveLength(3)
  })

  it("creates group and members in supabase on submit", async () => {
    const mockGroup = { id: "group-uuid", invite_token: "token-abc" }

    const mockInsertGroup = {
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockGroup, error: null }),
        }),
      }),
    }
    const mockInsertMembers = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    }

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === "groups")
        return mockInsertGroup as ReturnType<typeof supabase.from>
      return mockInsertMembers as ReturnType<typeof supabase.from>
    })

    render(
      <MemoryRouter>
        <CreateGroup />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText(/group name/i), {
      target: { value: "Trip to Oslo" },
    })

    const memberInputs = screen.getAllByPlaceholderText(/member name/i)
    fireEvent.change(memberInputs[0], { target: { value: "Alice" } })
    fireEvent.change(memberInputs[1], { target: { value: "Bob" } })

    fireEvent.click(screen.getByRole("button", { name: /create group/i }))

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("groups")
      expect(mockInsertGroup.insert).toHaveBeenCalledWith({
        name: "Trip to Oslo",
        currency: expect.any(String),
      })
    })

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("group_members")
      expect(mockInsertMembers.insert).toHaveBeenCalledWith([
        { group_id: "group-uuid", guest_name: "Alice" },
        { group_id: "group-uuid", guest_name: "Bob" },
      ])
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
