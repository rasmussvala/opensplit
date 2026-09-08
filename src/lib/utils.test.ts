import { describe, expect, it } from "vitest"
import { cn, useAppVersion } from "./utils"

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b")
  })

  it("filters falsy values", () => {
    expect(cn("a", false, null, undefined, "c")).toBe("a c")
  })

  it("supports object and array forms via clsx", () => {
    expect(cn("a", { b: true, c: false }, ["d", "e"])).toBe("a b d e")
  })

  it("dedupes conflicting Tailwind classes via twMerge", () => {
    expect(cn("p-2", "p-4")).toBe("p-4")
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500")
  })
})

describe("useAppVersion", () => {
  it("returns the version injected at build time", () => {
    expect(useAppVersion()).toBe(import.meta.env.VITE_APP_VERSION ?? "dev")
  })

  it("returns a non-empty string", () => {
    expect(useAppVersion()).toMatch(/\S/)
  })
})
