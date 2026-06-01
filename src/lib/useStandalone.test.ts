import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { isMobileDevice, useStandalone } from "./useStandalone"

function mockMatchMedia(matchingModes: string[]) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: matchingModes.some((mode) => query.includes(mode)),
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

function setNavigator(props: Record<string, unknown>) {
  for (const [key, value] of Object.entries(props)) {
    Object.defineProperty(navigator, key, { value, configurable: true })
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  setNavigator({
    userAgentData: undefined,
    platform: "",
    maxTouchPoints: 0,
    standalone: undefined,
  })
})

describe("useStandalone", () => {
  it("returns true when a standalone display mode matches", () => {
    mockMatchMedia(["standalone"])
    const { result } = renderHook(() => useStandalone())
    expect(result.current).toBe(true)
  })

  it("returns true for iOS navigator.standalone", () => {
    mockMatchMedia([])
    setNavigator({ standalone: true })
    const { result } = renderHook(() => useStandalone())
    expect(result.current).toBe(true)
  })

  it("returns false in a normal browser tab", () => {
    mockMatchMedia([])
    const { result } = renderHook(() => useStandalone())
    expect(result.current).toBe(false)
  })

  it("subscribes, re-evaluates on change, and unsubscribes", () => {
    let matches = false
    const handlers: Array<() => void> = []
    window.matchMedia = vi.fn().mockImplementation(() => ({
      get matches() {
        return matches
      },
      addEventListener: (_: string, handler: () => void) =>
        handlers.push(handler),
      removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia

    const { result, unmount } = renderHook(() => useStandalone())
    expect(result.current).toBe(false)

    // Simulate the app being installed and a display-mode change firing.
    matches = true
    act(() => {
      for (const handler of handlers) handler()
    })
    expect(result.current).toBe(true)

    unmount()
  })
})

describe("isMobileDevice", () => {
  it("prefers userAgentData.mobile when available", () => {
    setNavigator({ userAgentData: { mobile: true } })
    expect(isMobileDevice()).toBe(true)

    setNavigator({ userAgentData: { mobile: false } })
    expect(isMobileDevice()).toBe(false)
  })

  it("detects phones via user agent", () => {
    setNavigator({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)" })
    expect(isMobileDevice()).toBe(true)
  })

  it("detects iPadOS reporting a Mac UA via touch points", () => {
    setNavigator({
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)",
      platform: "MacIntel",
      maxTouchPoints: 5,
    })
    expect(isMobileDevice()).toBe(true)
  })

  it("returns false for a real desktop", () => {
    setNavigator({
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15)",
      platform: "MacIntel",
      maxTouchPoints: 0,
    })
    expect(isMobileDevice()).toBe(false)
  })
})
