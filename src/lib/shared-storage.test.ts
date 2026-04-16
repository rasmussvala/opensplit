import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  loadLastGroup,
  loadSession,
  saveLastGroup,
  saveSession,
} from "./shared-storage"

function createMockCache() {
  const store = new Map<string, Response>()
  return {
    put: vi.fn(async (key: string, response: Response) => {
      store.set(key, response.clone())
    }),
    match: vi.fn(async (key: string) => {
      const r = store.get(key)
      return r ? r.clone() : undefined
    }),
    _store: store,
  }
}

describe("shared-storage", () => {
  let mockCache: ReturnType<typeof createMockCache>

  beforeEach(() => {
    mockCache = createMockCache()
    vi.stubGlobal("caches", {
      open: vi.fn(async () => mockCache),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe("session", () => {
    it("round-trips session tokens", async () => {
      await saveSession("access-abc", "refresh-xyz")
      const result = await loadSession()

      expect(result).toEqual({
        access_token: "access-abc",
        refresh_token: "refresh-xyz",
      })
    })

    it("returns null when no session saved", async () => {
      const result = await loadSession()
      expect(result).toBeNull()
    })

    it("overwrites previous session", async () => {
      await saveSession("old-access", "old-refresh")
      await saveSession("new-access", "new-refresh")
      const result = await loadSession()

      expect(result).toEqual({
        access_token: "new-access",
        refresh_token: "new-refresh",
      })
    })
  })

  describe("lastGroup", () => {
    it("round-trips invite token", async () => {
      await saveLastGroup("abc-123-def")
      const result = await loadLastGroup()

      expect(result).toBe("abc-123-def")
    })

    it("returns null when no group saved", async () => {
      const result = await loadLastGroup()
      expect(result).toBeNull()
    })

    it("overwrites previous group", async () => {
      await saveLastGroup("group-1")
      await saveLastGroup("group-2")
      const result = await loadLastGroup()

      expect(result).toBe("group-2")
    })
  })

  describe("graceful failure", () => {
    it("returns null from loadSession when caches unavailable", async () => {
      vi.stubGlobal("caches", undefined)
      const result = await loadSession()
      expect(result).toBeNull()
    })

    it("returns null from loadLastGroup when caches unavailable", async () => {
      vi.stubGlobal("caches", undefined)
      const result = await loadLastGroup()
      expect(result).toBeNull()
    })

    it("does not throw from saveSession when caches unavailable", async () => {
      vi.stubGlobal("caches", undefined)
      await expect(saveSession("a", "b")).resolves.toBeUndefined()
    })

    it("does not throw from saveLastGroup when caches unavailable", async () => {
      vi.stubGlobal("caches", undefined)
      await expect(saveLastGroup("x")).resolves.toBeUndefined()
    })
  })
})
