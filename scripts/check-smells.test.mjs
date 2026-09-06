import { execFileSync } from "node:child_process"
import { describe, expect, it } from "vitest"

describe("smell check contract", () => {
  it("reports the smell summary", () => {
    let output = ""
    try {
      output = execFileSync(process.execPath, ["scripts/check-smells.mjs"], {
        encoding: "utf8",
      })
    } catch (error) {
      output = error.stdout
    }
    expect(output).toMatch(/Smell check: \d+ findings?$/m)
  })
})
