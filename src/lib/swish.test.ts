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
  it("builds a swish:// URL with encoded message", () => {
    expect(
      buildSwishDeepLink({
        phone: "46701234567",
        amount: "42.50",
        message: "Dinner & drinks",
      }),
    ).toBe(
      "swish://payment?phone=46701234567&amount=42.50&message=Dinner%20%26%20drinks",
    )
  })

  it("encodes unicode in the message", () => {
    expect(
      buildSwishDeepLink({
        phone: "46701234567",
        amount: "100.00",
        message: "Räkor",
      }),
    ).toBe("swish://payment?phone=46701234567&amount=100.00&message=R%C3%A4kor")
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
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("returns true for an iPhone user agent", () => {
    vi.stubGlobal("navigator", {
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605",
    })
    expect(isMobileSwishDevice()).toBe(true)
  })

  it("returns true for an Android user agent", () => {
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537",
    })
    expect(isMobileSwishDevice()).toBe(true)
  })

  it("returns false for a desktop user agent", () => {
    vi.stubGlobal("navigator", {
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605",
    })
    expect(isMobileSwishDevice()).toBe(false)
  })
})
