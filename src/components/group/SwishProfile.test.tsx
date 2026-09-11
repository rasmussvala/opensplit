import { InMemoryStore, manageMembership } from "@rasmussvala/opensplit-core"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import SwishProfile from "./SwishProfile"

const group = {
  id: "group-1",
  name: "Trip",
  currency: "SEK",
  invite_code: "trip-code",
}

const alice = {
  id: "m1",
  group_id: "group-1",
  guest_name: "Alice",
  user_id: "user-1",
  swish_phone: "46701234567",
}

/** The real membership module over data the test can read back. */
let membership: ReturnType<typeof manageMembership>

vi.mock("@/application/composition", () => ({
  application: {
    get membership() {
      return membership
    },
  },
}))

/** The number the module has saved against Alice. */
async function savedPhone() {
  const [held] = await membership.listGroups("user-1")
  return held.member.swishPhone
}

describe("SwishProfile", () => {
  beforeEach(() => {
    membership = manageMembership(
      new InMemoryStore({
        groups: [group],
        members: [{ ...alice }],
      }).memberships,
    )
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
    const onUpdated = vi.fn()
    render(
      <SwishProfile memberId="m1" currentPhone={null} onUpdated={onUpdated} />,
    )

    fireEvent.click(screen.getByRole("button", { name: /edit swish phone/i }))
    fireEvent.change(screen.getByLabelText(/your swish phone/i), {
      target: { value: "070 765 43 21" },
    })
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }))

    await waitFor(async () => {
      expect(await savedPhone()).toBe("46707654321")
      expect(onUpdated).toHaveBeenCalled()
    })
  })

  it("blocks save and shows an error for an invalid phone", async () => {
    render(
      <SwishProfile memberId="m1" currentPhone={null} onUpdated={vi.fn()} />,
    )

    fireEvent.click(screen.getByRole("button", { name: /edit swish phone/i }))
    fireEvent.change(screen.getByLabelText(/your swish phone/i), {
      target: { value: "abc" },
    })
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }))

    expect(
      await screen.findByText(/enter a valid swedish mobile number/i),
    ).toBeInTheDocument()
    expect(await savedPhone()).toBe("46701234567")
  })

  it("removes the number when the input is left blank", async () => {
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

    await waitFor(async () => expect(await savedPhone()).toBeNull())
  })

  it("Cancel returns to the read-only view without saving", async () => {
    render(
      <SwishProfile
        memberId="m1"
        currentPhone="46701234567"
        onUpdated={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /edit swish phone/i }))
    fireEvent.change(screen.getByLabelText(/your swish phone/i), {
      target: { value: "0709999999" },
    })
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }))

    expect(screen.getByText("46701234567")).toBeInTheDocument()
    expect(await savedPhone()).toBe("46701234567")
  })
})
