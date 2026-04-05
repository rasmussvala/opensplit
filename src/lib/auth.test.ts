import { beforeEach, describe, expect, it, vi } from "vitest"
import { supabase } from "@/lib/supabase"
import { ensureSession } from "./auth"

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signInAnonymously: vi.fn(),
    },
  },
}))

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

    const userId = await ensureSession()

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

    const userId = await ensureSession()

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

    await expect(ensureSession()).rejects.toThrow(
      "Failed to create anonymous session",
    )
  })
})
