import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { supabase } from "@/lib/supabase"
import GroupList from "./GroupList"

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}))

function mockSupabaseSelect(data: unknown[], error: unknown = null) {
  vi.mocked(supabase.from).mockReturnValue({
    select: vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({ data, error }),
    }),
  } as unknown as ReturnType<typeof supabase.from>)
}

describe("GroupList", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders loading state initially", () => {
    mockSupabaseSelect([])

    render(
      <MemoryRouter>
        <GroupList />
      </MemoryRouter>,
    )

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it("renders groups after fetch", async () => {
    mockSupabaseSelect([
      {
        id: "g1",
        name: "Trip to Oslo",
        currency: "NOK",
        invite_token: "token-1",
        created_at: "2026-04-01T00:00:00Z",
        group_members: [{ count: 3 }],
      },
      {
        id: "g2",
        name: "Dinner Club",
        currency: "USD",
        invite_token: "token-2",
        created_at: "2026-04-02T00:00:00Z",
        group_members: [{ count: 1 }],
      },
    ])

    render(
      <MemoryRouter>
        <GroupList />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText("Trip to Oslo")).toBeInTheDocument()
      expect(screen.getByText("Dinner Club")).toBeInTheDocument()
    })

    expect(screen.getByText("NOK")).toBeInTheDocument()
    expect(screen.getByText("USD")).toBeInTheDocument()
    expect(screen.getByText("3 members")).toBeInTheDocument()
    expect(screen.getByText("1 member")).toBeInTheDocument()
  })

  it("renders empty state when no groups exist", async () => {
    mockSupabaseSelect([])

    render(
      <MemoryRouter>
        <GroupList />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText(/no groups yet/i)).toBeInTheDocument()
    })
  })

  it("links each group to its invite URL", async () => {
    mockSupabaseSelect([
      {
        id: "g1",
        name: "Trip to Oslo",
        currency: "NOK",
        invite_token: "token-1",
        created_at: "2026-04-01T00:00:00Z",
        group_members: [{ count: 2 }],
      },
    ])

    render(
      <MemoryRouter>
        <GroupList />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText("Trip to Oslo")).toBeInTheDocument()
    })

    const link = screen.getByRole("link", { name: /trip to oslo/i })
    expect(link).toHaveAttribute("href", "/groups/token-1")
  })
})
