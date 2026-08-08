import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { supabase } from "@/lib/supabase"
import GroupPage from "./GroupPage"

const { executeMock } = vi.hoisted(() => ({ executeMock: vi.fn() }))

vi.mock("@/application/groups/loadGroupSnapshot", () => ({
  loadGroupSnapshot: vi.fn(() => ({ execute: executeMock })),
}))

vi.mock("@/infrastructure/supabase/supabaseGroupDataSource", () => ({
  SupabaseGroupDataSource: vi.fn(),
}))

vi.mock("@/lib/supabase", () => ({
  supabase: {
    channel: vi.fn(),
    removeChannel: vi.fn(),
  },
}))

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({ userId: "test-user-id" }),
}))

const group = {
  id: "group-1",
  name: "Trip to Oslo",
  currency: "USD",
  inviteToken: "token-abc",
}

const member = {
  id: "member-1",
  name: "Alice",
  userId: "test-user-id",
  swishPhone: null,
}

function renderWithRoute(inviteToken = "token-abc") {
  return render(
    <MemoryRouter initialEntries={[`/groups/${inviteToken}`]}>
      <Routes>
        <Route path="/groups/:inviteToken" element={<GroupPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function createMockChannel() {
  const channel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  }
  vi.mocked(supabase.channel).mockReturnValue(
    channel as unknown as ReturnType<typeof supabase.channel>,
  )
  vi.mocked(supabase.removeChannel).mockResolvedValue("ok" as never)
  return channel
}

function memberResult(overrides = {}) {
  return {
    status: "member" as const,
    snapshot: {
      group,
      currentMember: member,
      members: [member],
      expenses: [],
      settlements: [],
      ...overrides,
    },
  }
}

describe("GroupPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    createMockChannel()
  })

  it("shows loading state initially", () => {
    executeMock.mockReturnValue(new Promise(() => {}))

    renderWithRoute()

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it("shows error when the loader returns not-found", async () => {
    executeMock.mockResolvedValue({ status: "not-found" })

    renderWithRoute("invalid-token")

    await waitFor(() => {
      expect(screen.getByText(/group not found/i)).toBeInTheDocument()
    })
    expect(executeMock).toHaveBeenCalledWith({
      inviteToken: "invalid-token",
      userId: "test-user-id",
    })
  })

  it("shows join form when the loader says membership is required", async () => {
    executeMock.mockResolvedValue({ status: "join-required", group })

    renderWithRoute()

    await waitFor(() => {
      expect(screen.getByText(/join trip to oslo/i)).toBeInTheDocument()
    })
  })

  it("shows the group page for a member snapshot", async () => {
    executeMock.mockResolvedValue(memberResult())

    renderWithRoute()

    await waitFor(() => {
      expect(screen.getByText("Trip to Oslo")).toBeInTheDocument()
    })

    expect(
      screen.getByRole("link", { name: /add expense/i }),
    ).toBeInTheDocument()
  })

  it("renders balances from the loaded snapshot", async () => {
    const currentMember = {
      id: "member-2",
      name: "Bob",
      userId: "test-user-id",
      swishPhone: null,
    }
    executeMock.mockResolvedValue(
      memberResult({
        currentMember,
        members: [
          { ...member, userId: "user-1" },
          currentMember,
          {
            id: "member-3",
            name: "Charlie",
            userId: "user-3",
            swishPhone: null,
          },
        ],
        expenses: [
          {
            id: "expense-1",
            description: "Dinner",
            amount: 120,
            paidBy: "member-1",
            splitAmong: ["member-1", "member-2", "member-3"],
            splitOverrides: null,
            createdAt: "2026-01-01T12:00:00Z",
          },
        ],
        settlements: [],
      }),
    )

    renderWithRoute("token-abc?tab=balances")

    await waitFor(() => {
      expect(screen.getByText("Trip to Oslo")).toBeInTheDocument()
    })

    expect(screen.getByRole("button", { name: /only you/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    )
  })

  it("subscribes to realtime changes for a member snapshot", async () => {
    const channel = createMockChannel()
    executeMock.mockResolvedValue(memberResult())

    renderWithRoute()

    await waitFor(() => {
      expect(channel.subscribe).toHaveBeenCalledOnce()
    })

    expect(supabase.channel).toHaveBeenCalledWith("group-group-1")
    expect(channel.on).toHaveBeenCalledTimes(3)
  })

  it("cleans up the realtime subscription on unmount", async () => {
    const channel = createMockChannel()
    executeMock.mockResolvedValue(memberResult())

    const { unmount } = renderWithRoute()

    await waitFor(() => {
      expect(channel.subscribe).toHaveBeenCalledOnce()
    })

    unmount()
    expect(supabase.removeChannel).toHaveBeenCalledWith(channel)
  })

  it("does not subscribe to realtime when membership is required", async () => {
    executeMock.mockResolvedValue({ status: "join-required", group })

    renderWithRoute()

    await waitFor(() => {
      expect(screen.getByText(/join trip to oslo/i)).toBeInTheDocument()
    })

    expect(supabase.channel).not.toHaveBeenCalled()
  })
})
