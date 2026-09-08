import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { AuthProvider, useAuth } from "./AuthProvider"

const mockEnsureSession = vi.fn()

vi.mock("@rasmussvala/opensplit-core", () => ({
  ensureSession: (...args: unknown[]) => mockEnsureSession(...args),
}))

// AuthProvider imports the client to inject it; ensureSession is mocked, so the
// stub is never used. It only keeps createClient from running without env vars.
vi.mock("@/lib/supabase", () => ({ supabase: {} }))

function TestConsumer() {
  const { userId } = useAuth()
  return <div data-testid="user-id">{userId}</div>
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("shows loading state while session is being established", () => {
    mockEnsureSession.mockReturnValue(new Promise(() => {}))

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
    expect(screen.queryByTestId("user-id")).not.toBeInTheDocument()
  })

  it("renders children with userId after session is established", async () => {
    mockEnsureSession.mockResolvedValue("test-user-id")

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId("user-id")).toHaveTextContent("test-user-id")
    })
  })

  it("useAuth throws when used outside AuthProvider", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {})

    expect(() => render(<TestConsumer />)).toThrow()

    consoleError.mockRestore()
  })
})
