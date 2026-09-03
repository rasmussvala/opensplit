import { execFileSync } from "node:child_process"
import { describe, expect, it } from "vitest"

describe("smell check contract", () => {
  it("reports findings with GitHub annotations", () => {
    let output = ""
    try {
      execFileSync(process.execPath, ["scripts/check-smells.mjs"], {
        encoding: "utf8",
      })
    } catch (error) {
      output = error.stdout
    }
    expect(output).toContain("::error file=")
    expect(output).toContain("Smell check:")
  })
})
