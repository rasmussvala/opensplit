import { afterEach, describe, expect, it, vi } from "vitest"
import {
  buildSwishDeepLink,
  buildSwishQrPayload,
  formatSwishAmount,
  isMobileSwishDevice,
  normalizeSwishPhone,
} from "./swish"

describe("normalizeSwishPhone", () => {
  it("normalizes a Swedish national number with separators", () => {
    expect(normalizeSwishPhone("070-123 45 67")).toBe("46701234567")
  })

  it("normalizes an international number with + and spaces", () => {
    expect(normalizeSwishPhone("+46 70 123 45 67")).toBe("46701234567")
  })

  it("normalizes a 0046-prefixed number", () => {
    expect(normalizeSwishPhone("0046701234567")).toBe("46701234567")
  })

  it("returns the canonical form unchanged", () => {
    expect(normalizeSwishPhone("46701234567")).toBe("46701234567")
  })

  it("returns null for empty input", () => {
    expect(normalizeSwishPhone("")).toBeNull()
  })

  it("returns null for non-numeric input", () => {
    expect(normalizeSwishPhone("abc")).toBeNull()
  })

  it("returns null for too-short input", () => {
    expect(normalizeSwishPhone("0701234")).toBeNull()
  })

  it("returns null for non-mobile Swedish prefixes", () => {
    expect(normalizeSwishPhone("08-123 45 67")).toBeNull()
  })

  it("returns null for non-Swedish country codes", () => {
    expect(normalizeSwishPhone("+1 555 123 4567")).toBeNull()
  })
})

describe("buildSwishDeepLink", () => {
  it("builds an app.swish.nu URL with encoded params", () => {
    expect(
      buildSwishDeepLink({
        phone: "46701234567",
        amount: "42.50",
        message: "Dinner & drinks",
      }),
    ).toBe(
      "https://app.swish.nu/1/p/sw/?sw=46701234567&amt=42.50&cur=SEK&msg=Dinner%20%26%20drinks&src=qr",
    )
  })

  it("encodes unicode in the message", () => {
    expect(
      buildSwishDeepLink({
        phone: "46701234567",
        amount: "100.00",
        message: "Räkor",
      }),
    ).toBe(
      "https://app.swish.nu/1/p/sw/?sw=46701234567&amt=100.00&cur=SEK&msg=R%C3%A4kor&src=qr",
    )
  })
})

describe("buildSwishQrPayload", () => {
  it("formats Type C payload", () => {
    expect(
      buildSwishQrPayload({
        phone: "46701234567",
        amount: "42.50",
        message: "Dinner",
      }),
    ).toBe("C46701234567;42.50;Dinner;")
  })
})

describe("formatSwishAmount", () => {
  it("pads integer to two decimals", () => {
    expect(formatSwishAmount(42)).toBe("42.00")
  })

  it("preserves one decimal as two", () => {
    expect(formatSwishAmount(42.5)).toBe("42.50")
  })

  it("preserves two decimals as-is", () => {
    expect(formatSwishAmount(123.45)).toBe("123.45")
  })
})

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
