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

  it("renders joined groups with member previews and total spending", async () => {
    mockMembership([
      {
        group: {
          id: "g1",
          name: "Trip to Oslo",
          currency: "NOK",
          invite_token: "token-1",
          created_at: "2026-04-01T00:00:00Z",
          members: [
            { id: "m1", guest_name: "Ada" },
            { id: "m2", guest_name: "Mina" },
            { id: "m3", guest_name: "Jo" },
            { id: "m4", guest_name: "Sam" },
          ],
          expenses: [{ amount: 120 }, { amount: 45.5 }],
        },
      },
      {
        group: {
          id: "g2",
          name: "Dinner Club",
          currency: "USD",
          invite_token: "token-2",
          created_at: "2026-04-02T00:00:00Z",
          members: [{ id: "m5", guest_name: "Pat" }],
          expenses: [],
        },
      },
    ])

    renderMyGroups()

    await waitFor(() => {
      expect(screen.getByText("Trip to Oslo")).toBeInTheDocument()
    })
    expect(screen.getByText("Dinner Club")).toBeInTheDocument()
    expect(screen.getByText("4 members")).toBeInTheDocument()
    expect(screen.getByText("1 member")).toBeInTheDocument()
    expect(screen.getByText("S")).toBeInTheDocument()
    expect(
      screen.getByRole("link", {
        name: "Trip to Oslo, NOK 165.50 spent, 4 members",
      }),
    ).toHaveAttribute("href", "/groups/token-1")
    expect(
      screen.getByRole("link", {
        name: "Dinner Club, USD 0.00 spent, 1 member",
      }),
    ).toBeInTheDocument()
  })

  it("renders an empty state when no groups are joined", async () => {
    mockMembership([])
    renderMyGroups()
    await waitFor(() => {
      expect(screen.getByText(/haven't joined any groups/i)).toBeInTheDocument()
    })
  })
})
