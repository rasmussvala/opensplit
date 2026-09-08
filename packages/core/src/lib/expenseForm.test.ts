import { describe, expect, it } from "vitest"
import {
  buildActiveOverrides,
  formatRaw,
  getSplitStatus,
  peoplePlural,
} from "./expenseForm"

describe("formatRaw", () => {
  it("returns empty string for non-finite values", () => {
    expect(formatRaw(Number.NaN)).toBe("")
    expect(formatRaw(Number.POSITIVE_INFINITY)).toBe("")
    expect(formatRaw(Number.NEGATIVE_INFINITY)).toBe("")
  })

  it("rounds to two decimals and stringifies", () => {
    expect(formatRaw(1.005 + 2.005)).toBe("3.01")
    expect(formatRaw(33.333333)).toBe("33.33")
    expect(formatRaw(0)).toBe("0")
    expect(formatRaw(50)).toBe("50")
  })
})

describe("peoplePlural", () => {
  it("returns 'person' for 1", () => {
    expect(peoplePlural(1)).toBe("person")
  })

  it("returns 'people' for any other count", () => {
    expect(peoplePlural(0)).toBe("people")
    expect(peoplePlural(2)).toBe("people")
    expect(peoplePlural(99)).toBe("people")
  })
})

describe("buildActiveOverrides", () => {
  it("returns null when overrides object is empty", () => {
    expect(buildActiveOverrides({}, ["a", "b"], "percent")).toBeNull()
  })

  it("returns null when no entries pass filtering", () => {
    expect(
      buildActiveOverrides({ a: "  ", b: "" }, ["a", "b"], "percent"),
    ).toBeNull()
  })

  it("drops members not in splitAmong", () => {
    expect(
      buildActiveOverrides({ a: "50", c: "25" }, ["a", "b"], "percent"),
    ).toEqual({ mode: "percent", values: { a: 50 } })
  })

  it("drops blank, non-finite, and negative values", () => {
    expect(
      buildActiveOverrides(
        { a: "50", b: "", c: "abc", d: "-5" },
        ["a", "b", "c", "d"],
        "amount",
      ),
    ).toEqual({ mode: "amount", values: { a: 50 } })
  })

  it("preserves the split mode in the result", () => {
    expect(buildActiveOverrides({ a: "10" }, ["a"], "amount")).toEqual({
      mode: "amount",
      values: { a: 10 },
    })
    expect(buildActiveOverrides({ a: "10" }, ["a"], "percent")).toEqual({
      mode: "percent",
      values: { a: 10 },
    })
  })

  it("accepts zero as a valid override", () => {
    expect(
      buildActiveOverrides({ a: "0", b: "50" }, ["a", "b"], "percent"),
    ).toEqual({ mode: "percent", values: { a: 0, b: 50 } })
  })
})

describe("getSplitStatus", () => {
  const baseArgs = {
    parsedAmount: 100,
    splitAmong: ["a", "b"],
    overrides: {} as Record<string, string>,
    splitMode: "percent" as const,
    currency: "USD",
    payerName: "Alice",
  }

  it("requires at least one selected member", () => {
    expect(getSplitStatus({ ...baseArgs, splitAmong: [] })).toEqual({
      message: "Select at least one person to split with.",
      isValid: false,
    })
  })

  it("returns silent valid status when amount is zero or negative", () => {
    expect(getSplitStatus({ ...baseArgs, parsedAmount: 0 })).toEqual({
      message: "",
      isValid: true,
    })
    expect(getSplitStatus({ ...baseArgs, parsedAmount: -5 })).toEqual({
      message: "",
      isValid: true,
    })
  })

  it("describes the equal split when no overrides are set", () => {
    const result = getSplitStatus(baseArgs)
    expect(result.isValid).toBe(true)
    expect(result.message).toBe("2 people split USD 100.00 equally")
  })

  it("uses 'person' (singular) when only one person splits", () => {
    const result = getSplitStatus({ ...baseArgs, splitAmong: ["a"] })
    expect(result.message).toBe("1 person split USD 100.00 equally")
  })

  it("rejects negative override values", () => {
    const result = getSplitStatus({
      ...baseArgs,
      overrides: { a: "-5" },
    })
    expect(result).toEqual({
      message: "Values must be zero or positive.",
      isValid: false,
    })
  })

  it("rejects non-finite override values", () => {
    const result = getSplitStatus({
      ...baseArgs,
      overrides: { a: "abc" },
    })
    expect(result.isValid).toBe(false)
    expect(result.message).toBe("Values must be zero or positive.")
  })

  it("rejects percent overrides above 100", () => {
    const result = getSplitStatus({
      ...baseArgs,
      overrides: { a: "150" },
    })
    expect(result).toEqual({
      message: "Percentages must be 100 or less.",
      isValid: false,
    })
  })

  it("allows percent values above 100 in amount mode", () => {
    const result = getSplitStatus({
      ...baseArgs,
      splitMode: "amount",
      overrides: { a: "150" },
    })
    expect(result.isValid).toBe(false)
    expect(result.message).toMatch(/exceed/)
  })

  it("flags overrides that exceed the total in amount mode", () => {
    const result = getSplitStatus({
      ...baseArgs,
      splitMode: "amount",
      overrides: { a: "120" },
    })
    expect(result).toEqual({
      message: "Overrides exceed USD 100.00 by USD 20.00.",
      isValid: false,
    })
  })

  it("describes a split remainder for partial overrides in percent mode", () => {
    const result = getSplitStatus({
      ...baseArgs,
      splitAmong: ["a", "b", "c"],
      overrides: { a: "50" },
    })
    expect(result.isValid).toBe(true)
    expect(result.message).toBe("Remainder USD 50.00 split equally (2 people)")
  })

  it("uses singular person in remainder text when one person remains", () => {
    const result = getSplitStatus({
      ...baseArgs,
      splitAmong: ["a", "b"],
      overrides: { a: "50" },
    })
    expect(result.isValid).toBe(true)
    expect(result.message).toBe("Remainder USD 50.00 split equally (1 person)")
  })

  it("flags overrides that fall short when everyone is overridden", () => {
    const result = getSplitStatus({
      ...baseArgs,
      overrides: { a: "30", b: "30" },
    })
    expect(result).toEqual({
      message: "Overrides fall short of USD 100.00 by USD 40.00.",
      isValid: false,
    })
  })

  it("attributes small rounding remainders to the payer", () => {
    const result = getSplitStatus({
      ...baseArgs,
      splitMode: "amount",
      overrides: { a: "49.99", b: "50.00" },
    })
    expect(result).toEqual({
      message: "Alice covers USD 0.01 rounding",
      isValid: true,
    })
  })

  it("reports an exact cover when overrides sum precisely", () => {
    const result = getSplitStatus({
      ...baseArgs,
      splitMode: "amount",
      overrides: { a: "60", b: "40" },
    })
    expect(result).toEqual({
      message: "Overrides cover USD 100.00",
      isValid: true,
    })
  })

  it("reports an exact cover for percent mode totaling 100", () => {
    const result = getSplitStatus({
      ...baseArgs,
      overrides: { a: "60", b: "40" },
    })
    expect(result.isValid).toBe(true)
    expect(result.message).toBe("Overrides cover USD 100.00")
  })

  it("ignores blank override entries", () => {
    const result = getSplitStatus({
      ...baseArgs,
      overrides: { a: "  ", b: "" },
    })
    expect(result.isValid).toBe(true)
    expect(result.message).toBe("2 people split USD 100.00 equally")
  })
})
