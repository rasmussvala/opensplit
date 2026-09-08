import { afterEach, describe, expect, it, vi } from "vitest"
import { isMobileSwishDevice } from "./swishDevice"

describe("isMobileSwishDevice", () => {
  function stubMatchMedia(matches: Record<string, boolean>) {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: matches[query] ?? false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }))
  }

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("returns true on touch device with no hover", () => {
    stubMatchMedia({
      "(pointer: coarse)": true,
      "(hover: none)": true,
    })
    expect(isMobileSwishDevice()).toBe(true)
  })

  it("returns false on desktop with mouse and hover", () => {
    stubMatchMedia({
      "(pointer: coarse)": false,
      "(hover: none)": false,
    })
    expect(isMobileSwishDevice()).toBe(false)
  })

  it("returns false when only one condition matches", () => {
    stubMatchMedia({
      "(pointer: coarse)": true,
      "(hover: none)": false,
    })
    expect(isMobileSwishDevice()).toBe(false)
  })
})
