import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { supabase } from "@/lib/supabase"
import MyGroups from "./MyGroups"

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}))

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({ userId: "test-user-id" }),
}))

function mockMembership(data: unknown[], error: unknown = null) {
  const eq = vi.fn().mockResolvedValue({ data, error })
  vi.mocked(supabase.from).mockReturnValue({
    select: vi.fn().mockReturnValue({ eq }),
  } as unknown as ReturnType<typeof supabase.from>)
  return { eq }
}

function renderMyGroups() {
  return render(
    <MemoryRouter>
      <MyGroups />
    </MemoryRouter>,
  )
}

describe("MyGroups", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("queries memberships for the current user", async () => {
    const { eq } = mockMembership([])
    renderMyGroups()
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("group_members")
      expect(eq).toHaveBeenCalledWith("user_id", "test-user-id")
    })
  })

  it("renders joined groups with member counts", async () => {
    mockMembership([
      {
        group: {
          id: "g1",
          name: "Trip to Oslo",
          currency: "NOK",
          invite_token: "token-1",
          created_at: "2026-04-01T00:00:00Z",
          members: [{ count: 3 }],
        },
      },
      {
        group: {
          id: "g2",
          name: "Dinner Club",
          currency: "USD",
          invite_token: "token-2",
          created_at: "2026-04-02T00:00:00Z",
          members: [{ count: 1 }],
        },
      },
    ])

    renderMyGroups()

    await waitFor(() => {
      expect(screen.getByText("Trip to Oslo")).toBeInTheDocument()
    })
    expect(screen.getByText("Dinner Club")).toBeInTheDocument()
    expect(screen.getByText("3 members")).toBeInTheDocument()
    expect(screen.getByText("1 member")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /trip to oslo/i })).toHaveAttribute(
      "href",
      "/groups/token-1",
    )
  })

  it("renders an empty state when no groups are joined", async () => {
    mockMembership([])
    renderMyGroups()
    await waitFor(() => {
      expect(screen.getByText(/haven't joined any groups/i)).toBeInTheDocument()
    })
  })
})
