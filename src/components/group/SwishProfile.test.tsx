import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { supabase } from "@/lib/supabase"
import SwishProfile from "./SwishProfile"

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}))

function mockUpdate() {
  const eqMock = vi.fn().mockResolvedValue({ error: null })
  const updateMock = vi.fn().mockReturnValue({ eq: eqMock })
  vi.mocked(supabase.from).mockReturnValue({
    update: updateMock,
  } as unknown as ReturnType<typeof supabase.from>)
  return { updateMock, eqMock }
}

describe("SwishProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows the current phone and an Edit button", () => {
    render(
      <SwishProfile
        memberId="m1"
        currentPhone="46701234567"
        onUpdated={vi.fn()}
      />,
    )
    expect(screen.getByText("46701234567")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /edit swish phone/i }),
    ).toBeInTheDocument()
  })

  it("shows 'Not set' when currentPhone is null", () => {
    render(
      <SwishProfile memberId="m1" currentPhone={null} onUpdated={vi.fn()} />,
    )
    expect(screen.getByText(/not set/i)).toBeInTheDocument()
  })

  it("opens the editor and saves a normalized phone number", async () => {
    const { updateMock, eqMock } = mockUpdate()
    const onUpdated = vi.fn()
    render(
      <SwishProfile memberId="m1" currentPhone={null} onUpdated={onUpdated} />,
    )

    fireEvent.click(screen.getByRole("button", { name: /edit swish phone/i }))

    fireEvent.change(screen.getByLabelText(/your swish phone/i), {
      target: { value: "070 123 45 67" },
    })
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }))

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("group_members")
      expect(updateMock).toHaveBeenCalledWith({ swish_phone: "46701234567" })
      expect(eqMock).toHaveBeenCalledWith("id", "m1")
      expect(onUpdated).toHaveBeenCalled()
    })
  })

  it("blocks save and shows an error for an invalid phone", () => {
    const { updateMock } = mockUpdate()
    render(
      <SwishProfile memberId="m1" currentPhone={null} onUpdated={vi.fn()} />,
    )

    fireEvent.click(screen.getByRole("button", { name: /edit swish phone/i }))
    fireEvent.change(screen.getByLabelText(/your swish phone/i), {
      target: { value: "abc" },
    })
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }))

    expect(
      screen.getByText(/enter a valid swedish mobile number/i),
    ).toBeInTheDocument()
    expect(updateMock).not.toHaveBeenCalled()
  })

  it("saves null when the input is left blank", async () => {
    const { updateMock } = mockUpdate()
    render(
      <SwishProfile
        memberId="m1"
        currentPhone="46701234567"
        onUpdated={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /edit swish phone/i }))
    fireEvent.change(screen.getByLabelText(/your swish phone/i), {
      target: { value: "" },
    })
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }))

    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith({ swish_phone: null })
    })
  })

  it("Cancel returns to the read-only view without calling supabase", () => {
    const { updateMock } = mockUpdate()
    render(
      <SwishProfile
        memberId="m1"
        currentPhone="46701234567"
        onUpdated={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /edit swish phone/i }))
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }))

    expect(screen.getByText("46701234567")).toBeInTheDocument()
    expect(updateMock).not.toHaveBeenCalled()
  })
})
