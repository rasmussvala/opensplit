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
  const select = vi.fn().mockReturnValue({
    order: vi.fn().mockResolvedValue({ data, error }),
  })
  vi.mocked(supabase.from).mockReturnValue({
    select,
  } as unknown as ReturnType<typeof supabase.from>)
  return { select }
}

describe("GroupList", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("reads each group's invite code from the invite_token column", async () => {
    const { select } = mockSupabaseSelect([])

    render(
      <MemoryRouter>
        <GroupList />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText(/no groups yet/i)).toBeInTheDocument()
    })
    expect(select).toHaveBeenCalledWith(
      expect.stringContaining("invite_code:invite_token"),
    )
  })

  it("renders loading state initially", async () => {
    mockSupabaseSelect([])

    render(
      <MemoryRouter>
        <GroupList />
      </MemoryRouter>,
    )

    expect(screen.getByText(/loading/i)).toBeInTheDocument()

    // Let the pending fetch resolve so React state settles inside act.
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })
  })

  it("renders groups after fetch", async () => {
    mockSupabaseSelect([
      {
        id: "g1",
        name: "Trip to Oslo",
        currency: "NOK",
        invite_code: "token-1",
        created_at: "2026-04-01T00:00:00Z",
      },
      {
        id: "g2",
        name: "Dinner Club",
        currency: "USD",
        invite_code: "token-2",
        created_at: "2026-04-02T00:00:00Z",
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
        invite_code: "token-1",
        created_at: "2026-04-01T00:00:00Z",
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
