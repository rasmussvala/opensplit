import { describe, expect, it } from "vitest"
import {
  buildSwishDeepLink,
  buildSwishQrPayload,
  formatSwishAmount,
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
