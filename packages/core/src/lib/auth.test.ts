import { beforeEach, describe, expect, it, vi } from "vitest"
import { ensureSession } from "./auth"

const supabase = {
  auth: {
    getSession: vi.fn(),
    signInAnonymously: vi.fn(),
  },
}
// biome-ignore lint/suspicious/noExplicitAny: test double for SupabaseClient
const client = supabase as any

describe("ensureSession", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns existing user id when session exists", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: { user: { id: "existing-user-id" } },
      },
      error: null,
    } as ReturnType<typeof supabase.auth.getSession> extends Promise<infer R>
      ? R
      : never)

    const userId = await ensureSession(client)

    expect(userId).toBe("existing-user-id")
    expect(supabase.auth.signInAnonymously).not.toHaveBeenCalled()
  })

  it("signs in anonymously when no session exists", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as ReturnType<typeof supabase.auth.getSession> extends Promise<infer R>
      ? R
      : never)

    vi.mocked(supabase.auth.signInAnonymously).mockResolvedValue({
      data: { user: { id: "new-anon-id" } },
      error: null,
    } as ReturnType<typeof supabase.auth.signInAnonymously> extends Promise<
      infer R
    >
      ? R
      : never)

    const userId = await ensureSession(client)

    expect(userId).toBe("new-anon-id")
    expect(supabase.auth.signInAnonymously).toHaveBeenCalledOnce()
  })

  it("throws when anonymous sign-in fails", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as ReturnType<typeof supabase.auth.getSession> extends Promise<infer R>
      ? R
      : never)

    vi.mocked(supabase.auth.signInAnonymously).mockResolvedValue({
      data: { user: null },
      error: { message: "sign-in failed" },
    } as ReturnType<typeof supabase.auth.signInAnonymously> extends Promise<
      infer R
    >
      ? R
      : never)

    await expect(ensureSession(client)).rejects.toThrow(
      "Failed to create anonymous session",
    )
  })
})
