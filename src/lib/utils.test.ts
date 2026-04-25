import { describe, expect, it } from "vitest"
import { cn, formatAmount, formatAmountNumber, round2 } from "./utils"

describe("formatAmountNumber", () => {
  it("formats integers with two decimals", () => {
    expect(formatAmountNumber(42)).toBe("42.00")
  })

  it("formats decimals to exactly two fraction digits", () => {
    expect(formatAmountNumber(42.5)).toBe("42.50")
    expect(formatAmountNumber(42.123)).toBe("42.12")
    expect(formatAmountNumber(42.125)).toBe("42.13")
  })

  it("uses thin space as thousand separator", () => {
    expect(formatAmountNumber(1000)).toBe("1 000.00")
    expect(formatAmountNumber(1234567.89)).toBe("1 234 567.89")
  })

  it("handles negative amounts", () => {
    expect(formatAmountNumber(-42.5)).toBe("-42.50")
    expect(formatAmountNumber(-1000)).toBe("-1 000.00")
  })

  it("handles zero", () => {
    expect(formatAmountNumber(0)).toBe("0.00")
  })

  it("rounds half-up toward even per Intl behaviour", () => {
    expect(formatAmountNumber(0.005)).toBe("0.01")
  })
})

describe("formatAmount", () => {
  it("prefixes the currency code with a space separator", () => {
    expect(formatAmount("USD", 42.5)).toBe("USD 42.50")
    expect(formatAmount("EUR", 100)).toBe("EUR 100.00")
    expect(formatAmount("SEK", 0)).toBe("SEK 0.00")
    expect(formatAmount("NOK", 1000)).toBe("NOK 1 000.00")
  })

  it("handles negative amounts", () => {
    expect(formatAmount("USD", -25)).toBe("USD -25.00")
  })
})

describe("round2", () => {
  it("returns already-rounded values unchanged", () => {
    expect(round2(1.23)).toBe(1.23)
    expect(round2(0)).toBe(0)
  })

  it("eliminates floating-point drift", () => {
    expect(round2(0.1 + 0.2)).toBe(0.3)
    expect(round2(1.005 + 2.005)).toBe(3.01)
  })

  it("rounds toward +Infinity for halves (Math.round semantics)", () => {
    // 1.005 * 100 has FP drift to 100.49999... → rounds down to 100
    expect(round2(1.005)).toBe(1)
    expect(round2(1.234)).toBe(1.23)
    // 1.235 * 100 has FP drift slightly above 123.5 → rounds to 124
    expect(round2(1.235)).toBe(1.24)
  })

  it("handles negatives", () => {
    // Math.round breaks ties toward +Infinity, so -1.235 → -1.24
    expect(round2(-1.235)).toBe(-1.24)
    expect(round2(-0.1 - 0.2)).toBe(-0.3)
  })

  it("handles large values", () => {
    expect(round2(1234567.891)).toBe(1234567.89)
  })
})

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b")
  })

  it("filters falsy values", () => {
    expect(cn("a", false && "b", null, undefined, "c")).toBe("a c")
  })

  it("supports object and array forms via clsx", () => {
    expect(cn("a", { b: true, c: false }, ["d", "e"])).toBe("a b d e")
  })

  it("dedupes conflicting Tailwind classes via twMerge", () => {
    expect(cn("p-2", "p-4")).toBe("p-4")
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500")
  })
})
