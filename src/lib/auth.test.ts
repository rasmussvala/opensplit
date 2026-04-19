import { beforeEach, describe, expect, it, vi } from "vitest"
import { supabase } from "@/lib/supabase"
import { ensureSession } from "./auth"
import * as sharedStorage from "./shared-storage"

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      signInAnonymously: vi.fn(),
      setSession: vi.fn(),
    },
  },
}))

vi.mock("./shared-storage", () => ({
  loadSession: vi.fn(),
  saveSession: vi.fn(),
}))

type GetSessionResult =
  ReturnType<typeof supabase.auth.getSession> extends Promise<infer R>
    ? R
    : never
type SetSessionResult =
  ReturnType<typeof supabase.auth.setSession> extends Promise<infer R>
    ? R
    : never
type SignInResult =
  ReturnType<typeof supabase.auth.signInAnonymously> extends Promise<infer R>
    ? R
    : never

describe("ensureSession", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns existing user id and saves session when session exists", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: { id: "existing-user-id" },
          access_token: "at",
          refresh_token: "rt",
        },
      },
      error: null,
    } as GetSessionResult)

    const userId = await ensureSession()

    expect(userId).toBe("existing-user-id")
    expect(sharedStorage.saveSession).toHaveBeenCalledWith("at", "rt")
    expect(supabase.auth.signInAnonymously).not.toHaveBeenCalled()
  })

  it("restores session from Cache Storage when no localStorage session", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as GetSessionResult)

    vi.mocked(sharedStorage.loadSession).mockResolvedValue({
      access_token: "cached-at",
      refresh_token: "cached-rt",
    })

    vi.mocked(supabase.auth.setSession).mockResolvedValue({
      data: {
        session: {
          user: { id: "restored-user" },
          access_token: "new-at",
          refresh_token: "new-rt",
        },
      },
      error: null,
    } as SetSessionResult)

    const userId = await ensureSession()

    expect(userId).toBe("restored-user")
    expect(supabase.auth.setSession).toHaveBeenCalledWith({
      access_token: "cached-at",
      refresh_token: "cached-rt",
    })
    expect(sharedStorage.saveSession).toHaveBeenCalledWith("new-at", "new-rt")
    expect(supabase.auth.signInAnonymously).not.toHaveBeenCalled()
  })

  it("falls through to signInAnonymously when cached session restoration fails", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as GetSessionResult)

    vi.mocked(sharedStorage.loadSession).mockResolvedValue({
      access_token: "expired-at",
      refresh_token: "expired-rt",
    })

    vi.mocked(supabase.auth.setSession).mockResolvedValue({
      data: { session: null },
      error: { message: "token expired" },
    } as SetSessionResult)

    vi.mocked(supabase.auth.signInAnonymously).mockResolvedValue({
      data: {
        user: { id: "fresh-anon" },
        session: { access_token: "fa", refresh_token: "fr" },
      },
      error: null,
    } as SignInResult)

    const userId = await ensureSession()

    expect(userId).toBe("fresh-anon")
    expect(supabase.auth.signInAnonymously).toHaveBeenCalledOnce()
    expect(sharedStorage.saveSession).toHaveBeenCalledWith("fa", "fr")
  })

  it("signs in anonymously when no cached session", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as GetSessionResult)

    vi.mocked(sharedStorage.loadSession).mockResolvedValue(null)

    vi.mocked(supabase.auth.signInAnonymously).mockResolvedValue({
      data: {
        user: { id: "new-anon-id" },
        session: { access_token: "a", refresh_token: "r" },
      },
      error: null,
    } as SignInResult)

    const userId = await ensureSession()

    expect(userId).toBe("new-anon-id")
    expect(supabase.auth.signInAnonymously).toHaveBeenCalledOnce()
  })

  it("throws when anonymous sign-in fails", async () => {
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    } as GetSessionResult)

    vi.mocked(sharedStorage.loadSession).mockResolvedValue(null)

    vi.mocked(supabase.auth.signInAnonymously).mockResolvedValue({
      data: { user: null },
      error: { message: "sign-in failed" },
    } as SignInResult)

    await expect(ensureSession()).rejects.toThrow(
      "Failed to create anonymous session",
    )
  })
})
