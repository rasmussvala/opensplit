import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { supabase } from "@/lib/supabase"
import * as swishLib from "@/lib/swish"
import SettlePage from "./SettlePage"

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}))

vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({ userId: "test-user-id" }),
}))

vi.mock("qrcode", () => ({
  default: {
    toDataURL: vi
      .fn()
      .mockResolvedValue("data:image/png;base64,FAKE_QR_PAYLOAD"),
  },
}))

const baseGroup = {
  id: "group-1",
  name: "Trip",
  currency: "USD",
  invite_token: "token-abc",
}

const baseMembers = [
  {
    id: "member-1",
    group_id: "group-1",
    guest_name: "Alice",
    user_id: "user-1",
    joined_at: "2026-01-01",
    swish_phone: null,
  },
  {
    id: "member-2",
    group_id: "group-1",
    guest_name: "Bob",
    user_id: "test-user-id",
    joined_at: "2026-01-01",
    swish_phone: null,
  },
]

const baseExpense = {
  id: "expense-1",
  group_id: "group-1",
  paid_by: "member-1",
  amount: 100,
  description: "Dinner",
  split_among: ["member-1", "member-2"],
  split_overrides: null,
  created_at: "2026-01-01T12:00:00Z",
}

interface SetupOptions {
  group?: typeof baseGroup | null
  currency?: string
  members?: typeof baseMembers
  recipientSwishPhone?: string | null
  groupName?: string
  expenses?: (typeof baseExpense)[]
  settlements?: unknown[]
  membership?: unknown
  insertResponse?: { error: unknown }
}

function setupSupabase(options: SetupOptions = {}) {
  const {
    currency,
    groupName,
    recipientSwishPhone,
    members = baseMembers,
    expenses = [baseExpense],
    settlements = [],
    membership = {
      id: "member-2",
      group_id: "group-1",
      user_id: "test-user-id",
    },
    insertResponse = { error: null },
  } = options

  const group =
    options.group === null
      ? null
      : {
          ...baseGroup,
          ...(currency ? { currency } : {}),
          ...(groupName ? { name: groupName } : {}),
        }

  const finalMembers =
    recipientSwishPhone !== undefined
      ? members.map((m) =>
          m.id === "member-1" ? { ...m, swish_phone: recipientSwishPhone } : m,
        )
      : members

  const insertMock = vi.fn().mockResolvedValue(insertResponse)

  let groupMembersCallCount = 0

  vi.mocked(supabase.from).mockImplementation((table: string) => {
    if (table === "groups") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: group,
              error: group ? null : { message: "not found" },
            }),
          }),
        }),
      } as unknown as ReturnType<typeof supabase.from>
    }
    if (table === "group_members") {
      groupMembersCallCount++
      if (groupMembersCallCount === 1) {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi
                  .fn()
                  .mockResolvedValue({ data: membership, error: null }),
              }),
            }),
          }),
        } as unknown as ReturnType<typeof supabase.from>
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: finalMembers, error: null }),
        }),
      } as unknown as ReturnType<typeof supabase.from>
    }
    if (table === "expenses") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: expenses, error: null }),
        }),
      } as unknown as ReturnType<typeof supabase.from>
    }
    if (table === "settlements") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: settlements, error: null }),
        }),
        insert: insertMock,
      } as unknown as ReturnType<typeof supabase.from>
    }
    throw new Error(`Unexpected table: ${table}`)
  })

  return { insertMock }
}

function renderRoute(
  inviteToken = "token-abc",
  fromMemberId = "member-2",
  toMemberId = "member-1",
) {
  return render(
    <MemoryRouter
      initialEntries={[
        `/groups/${inviteToken}/settle/${fromMemberId}/${toMemberId}`,
      ]}
    >
      <Routes>
        <Route
          path="/groups/:inviteToken/settle/:fromMemberId/:toMemberId"
          element={<SettlePage />}
        />
        <Route path="/groups/:inviteToken" element={<div>Group page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe("SettlePage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(swishLib, "isMobileSwishDevice").mockReturnValue(false)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("shows loading state initially", () => {
    vi.mocked(supabase.from).mockImplementation(
      () =>
        ({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockReturnValue(new Promise(() => {})),
            }),
          }),
        }) as unknown as ReturnType<typeof supabase.from>,
    )

    renderRoute()

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it("shows not-found when the group lookup fails", async () => {
    setupSupabase({ group: null })

    renderRoute()

    await waitFor(() => {
      expect(screen.getByText(/settlement not found/i)).toBeInTheDocument()
    })
  })

  it("shows not-found when the user is not a group member", async () => {
    setupSupabase({ membership: null })

    renderRoute()

    await waitFor(() => {
      expect(screen.getByText(/settlement not found/i)).toBeInTheDocument()
    })
  })

  it("renders the proposed settlement amount and names", async () => {
    setupSupabase()

    renderRoute()

    await waitFor(() => {
      expect(screen.getByText(/bob owes alice USD 50\.00/i)).toBeInTheDocument()
    })

    expect(screen.getByText("USD")).toBeInTheDocument()
    expect(screen.getByText("50.00")).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /mark settled/i }),
    ).toBeInTheDocument()
  })

  it("shows the no-outstanding-debt empty state when already settled", async () => {
    setupSupabase({
      settlements: [
        {
          id: "s1",
          group_id: "group-1",
          from_member: "member-2",
          to_member: "member-1",
          amount: 50,
          settled_at: "2026-01-02T12:00:00Z",
        },
      ],
    })

    renderRoute()

    await waitFor(() => {
      expect(
        screen.getByText(/no outstanding debt between bob and alice/i),
      ).toBeInTheDocument()
    })
    expect(
      screen.queryByRole("button", { name: /mark settled/i }),
    ).not.toBeInTheDocument()
  })

  it("inserts a settlement and navigates to the payments tab", async () => {
    const { insertMock } = setupSupabase()

    renderRoute()

    const settleButton = await screen.findByRole("button", {
      name: /mark settled/i,
    })
    fireEvent.click(settleButton)

    await waitFor(() => {
      expect(insertMock).toHaveBeenCalledWith({
        group_id: "group-1",
        from_member: "member-2",
        to_member: "member-1",
        amount: 50,
      })
    })

    await waitFor(() => {
      expect(screen.getByText(/group page/i)).toBeInTheDocument()
    })
  })

  it("does not render the Swish card for non-SEK groups", async () => {
    setupSupabase({ recipientSwishPhone: "46701234567" })

    renderRoute()

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /mark settled/i }),
      ).toBeInTheDocument()
    })

    expect(
      screen.queryByRole("link", { name: /pay with swish/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /pay with swish/i }),
    ).not.toBeInTheDocument()
  })

  it("renders the QR for a SEK group with recipient phone, but hides the button on desktop", async () => {
    setupSupabase({
      currency: "SEK",
      groupName: "Trip",
      recipientSwishPhone: "46701234567",
    })

    renderRoute()

    const qr = await screen.findByAltText(/swish qr code/i)
    expect(qr).toHaveAttribute("src", "data:image/png;base64,FAKE_QR_PAYLOAD")

    expect(
      screen.queryByRole("link", { name: /pay with swish/i }),
    ).not.toBeInTheDocument()
  })

  it("renders the Pay-with-Swish anchor on mobile with the hardcoded Opensplit message", async () => {
    vi.spyOn(swishLib, "isMobileSwishDevice").mockReturnValue(true)
    setupSupabase({
      currency: "SEK",
      groupName: "Trip",
      recipientSwishPhone: "46701234567",
    })

    renderRoute()

    const link = await screen.findByRole("link", { name: /pay with swish/i })
    expect(link).toHaveAttribute(
      "href",
      "swish://payment?phone=46701234567&amount=50.00&message=Opensplit%3A%20Trip",
    )
  })

  it("copies the formatted amount to the clipboard when Copy amount is clicked", async () => {
    setupSupabase()
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal("navigator", {
      ...navigator,
      clipboard: { writeText },
      userAgent: navigator.userAgent,
    })

    renderRoute()

    const copyButton = await screen.findByRole("button", {
      name: /copy amount/i,
    })
    fireEvent.click(copyButton)

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("50.00")
    })

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /copied/i }),
      ).toBeInTheDocument()
    })

    vi.unstubAllGlobals()
  })

  it("shows the no-phone helper text without a button when recipient has no phone", async () => {
    setupSupabase({ currency: "SEK", recipientSwishPhone: null })

    renderRoute()

    await waitFor(() => {
      expect(
        screen.getByText(/alice hasn't added a swish number yet/i),
      ).toBeInTheDocument()
    })

    expect(
      screen.queryByRole("link", { name: /pay with swish/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /pay with swish/i }),
    ).not.toBeInTheDocument()
  })
})
