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

const group = { id: "group-1", name: "Trip to Oslo" }
const onJoined = vi.fn()

function setup(currency = "USD") {
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
      currency={currency}
      onJoined={onJoined}
    />,
  )

  return mockInsert
}

describe("JoinGroup", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders a display name input and join button", () => {
    setup()
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /join/i })).toBeInTheDocument()
  })

  it("shows the group name", () => {
    setup()
    expect(screen.getByText(/trip to oslo/i)).toBeInTheDocument()
  })

  it("inserts a group_members row on submit and calls onJoined", async () => {
    const mockInsert = setup()

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
    setup()
    fireEvent.click(screen.getByRole("button", { name: /join/i }))
    expect(supabase.from).not.toHaveBeenCalled()
    expect(onJoined).not.toHaveBeenCalled()
  })

  it("does not render the Swish phone field for non-SEK groups", () => {
    setup("USD")
    expect(screen.queryByLabelText(/swish phone/i)).not.toBeInTheDocument()
  })

  it("renders the Swish phone field for SEK groups", () => {
    setup("SEK")
    expect(screen.getByLabelText(/swish phone/i)).toBeInTheDocument()
  })

  it("inserts swish_phone as null when SEK group joined without phone", async () => {
    const mockInsert = setup("SEK")

    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: "Alice" },
    })
    fireEvent.click(screen.getByRole("button", { name: /join/i }))

    await waitFor(() => {
      expect(mockInsert.insert).toHaveBeenCalledWith({
        group_id: "group-1",
        guest_name: "Alice",
        user_id: "test-user-id",
        swish_phone: null,
      })
    })
  })

  it("normalizes a valid Swish phone before insert", async () => {
    const mockInsert = setup("SEK")

    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: "Alice" },
    })
    fireEvent.change(screen.getByLabelText(/swish phone/i), {
      target: { value: "070 123 45 67" },
    })
    fireEvent.click(screen.getByRole("button", { name: /join/i }))

    await waitFor(() => {
      expect(mockInsert.insert).toHaveBeenCalledWith({
        group_id: "group-1",
        guest_name: "Alice",
        user_id: "test-user-id",
        swish_phone: "46701234567",
      })
    })
  })

  it("blocks submit and shows an error when the Swish phone is invalid", async () => {
    const mockInsert = setup("SEK")

    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: "Alice" },
    })
    fireEvent.change(screen.getByLabelText(/swish phone/i), {
      target: { value: "abc" },
    })
    fireEvent.click(screen.getByRole("button", { name: /join/i }))

    expect(
      screen.getByText(/enter a valid swedish mobile number/i),
    ).toBeInTheDocument()
    expect(mockInsert.insert).not.toHaveBeenCalled()
    expect(onJoined).not.toHaveBeenCalled()
  })
})
