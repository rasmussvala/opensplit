import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  loadLastGroup,
  loadSession,
  saveLastGroup,
  saveSession,
} from "./shared-storage"

function createCacheStub() {
  const store = new Map<string, Response>()
  const cache = {
    put: vi.fn(async (key: string, response: Response) => {
      store.set(key, response)
    }),
    match: vi.fn(async (key: string) => store.get(key)),
  }
  const caches = {
    open: vi.fn(async () => cache),
  }
  return { caches, cache, store }
}

describe("shared-storage", () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it("round-trips session tokens via Cache Storage", async () => {
    const { caches } = createCacheStub()
    vi.stubGlobal("caches", caches)

    await saveSession("access-1", "refresh-1")
    const loaded = await loadSession()

    expect(loaded).toEqual({
      access_token: "access-1",
      refresh_token: "refresh-1",
    })
  })

  it("returns null when no session cached", async () => {
    const { caches } = createCacheStub()
    vi.stubGlobal("caches", caches)

    expect(await loadSession()).toBeNull()
  })

  it("returns null when Cache API throws", async () => {
    vi.stubGlobal("caches", {
      open: vi.fn(async () => {
        throw new Error("unavailable")
      }),
    })

    expect(await loadSession()).toBeNull()
  })

  it("swallows errors when saving session with Cache API unavailable", async () => {
    vi.stubGlobal("caches", {
      open: vi.fn(async () => {
        throw new Error("unavailable")
      }),
    })

    await expect(saveSession("a", "b")).resolves.toBeUndefined()
  })

  it("round-trips last-group invite token", async () => {
    const { caches } = createCacheStub()
    vi.stubGlobal("caches", caches)

    await saveLastGroup("token-abc")
    expect(await loadLastGroup()).toBe("token-abc")
  })

  it("returns null when no last group cached", async () => {
    const { caches } = createCacheStub()
    vi.stubGlobal("caches", caches)

    expect(await loadLastGroup()).toBeNull()
  })
})
