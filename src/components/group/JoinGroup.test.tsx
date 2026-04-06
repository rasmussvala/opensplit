import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { supabase } from "@/lib/supabase"
import JoinGroup from "./JoinGroup"

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}))

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({ userId: "test-user-id" }),
}))

describe("JoinGroup", () => {
  const group = { id: "group-1", name: "Trip to Oslo" }
  const onJoined = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders a display name input and join button", () => {
    render(
      <JoinGroup
        groupId={group.id}
        groupName={group.name}
        onJoined={onJoined}
      />,
    )

    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /join/i })).toBeInTheDocument()
  })

  it("shows the group name", () => {
    render(
      <JoinGroup
        groupId={group.id}
        groupName={group.name}
        onJoined={onJoined}
      />,
    )

    expect(screen.getByText(/trip to oslo/i)).toBeInTheDocument()
  })

  it("inserts a group_members row on submit and calls onJoined", async () => {
    const mockInsert = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    }

    vi.mocked(supabase.from).mockReturnValue(
      mockInsert as unknown as ReturnType<typeof supabase.from>,
    )

    render(
      <JoinGroup
        groupId={group.id}
        groupName={group.name}
        onJoined={onJoined}
      />,
    )

    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: "Alice" },
    })

    fireEvent.click(screen.getByRole("button", { name: /join/i }))

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("group_members")
      expect(mockInsert.insert).toHaveBeenCalledWith({
        group_id: "group-1",
        guest_name: "Alice",
        user_id: "test-user-id",
      })
    })

    await waitFor(() => {
      expect(onJoined).toHaveBeenCalled()
    })
  })

  it("does not submit with empty name", () => {
    render(
      <JoinGroup
        groupId={group.id}
        groupName={group.name}
        onJoined={onJoined}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /join/i }))

    expect(supabase.from).not.toHaveBeenCalled()
    expect(onJoined).not.toHaveBeenCalled()
  })
})
