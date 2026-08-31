import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { execute, deleteSettlement } = vi.hoisted(() => ({
  execute: vi.fn(),
  deleteSettlement: vi.fn(),
}))

vi.mock("@/application/composition", () => ({
  application: {
    groups: { execute },
    settlements: { delete: deleteSettlement },
  },
}))
vi.mock("@/components/auth/AuthProvider", () => ({
  useAuth: () => ({ userId: "user-1" }),
}))

import EditSettlementPage from "./EditSettlementPage"

const snapshot = {
  group: { id: "group-1", name: "Trip", currency: "USD", inviteToken: "token" },
  currentMember: {
    id: "member-1",
    name: "Alice",
    userId: "user-1",
    swishPhone: null,
  },
  members: [
    { id: "member-1", name: "Alice", userId: "user-1", swishPhone: null },
    { id: "member-2", name: "Bob", userId: "user-2", swishPhone: null },
  ],
  expenses: [],
  settlements: [
    {
      id: "settlement-1",
      from: "member-2",
      to: "member-1",
      amount: 42.5,
      settledAt: "2026-03-04T12:00:00Z",
    },
  ],
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/groups/token/settlements/settlement-1"]}>
      <Routes>
        <Route
          path="/groups/:inviteToken/settlements/:settlementId"
          element={<EditSettlementPage />}
        />
        <Route path="/groups/:inviteToken" element={<div>Group page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe("EditSettlementPage", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    execute.mockResolvedValue({ status: "member", snapshot })
    deleteSettlement.mockResolvedValue({ status: "deleted" })
  })

  it("shows loading while loading the group snapshot", () => {
    execute.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
  it("shows not found for missing or inaccessible records", async () => {
    execute.mockResolvedValue({ status: "not-found" })
    renderPage()
    await waitFor(() =>
      expect(screen.getByText(/payment not found/i)).toBeInTheDocument(),
    )
  })
  it("renders the domain settlement and deletes through the application seam", async () => {
    renderPage()
    expect(
      await screen.findByText(/bob paid alice USD 42\.50 on MAR 4, 2026/i),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /delete payment/i }))
    await waitFor(() =>
      expect(deleteSettlement).toHaveBeenCalledWith("group-1", "settlement-1"),
    )
    expect(await screen.findByText("Group page")).toBeInTheDocument()
  })
})
