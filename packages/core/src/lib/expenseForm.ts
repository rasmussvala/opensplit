import type { SplitOverrideMode, SplitOverrides } from "./types"
import { formatAmount, round2 } from "./utils"

export interface SplitStatus {
  message: string
  isValid: boolean
}

export function formatRaw(value: number): string {
  if (!Number.isFinite(value)) return ""
  return round2(value).toString()
}

export function peoplePlural(n: number): string {
  return n === 1 ? "person" : "people"
}

export function buildActiveOverrides(
  overrides: Record<string, string>,
  splitAmong: string[],
  splitMode: SplitOverrideMode,
): SplitOverrides | null {
  const values: Record<string, number> = {}
  for (const [memberId, raw] of Object.entries(overrides)) {
    if (!splitAmong.includes(memberId)) continue
    if (!raw.trim()) continue
    const num = Number(raw)
    if (!Number.isFinite(num) || num < 0) continue
    values[memberId] = num
  }
  if (Object.keys(values).length === 0) return null
  return { mode: splitMode, values }
}

export function getSplitStatus({
  parsedAmount,
  splitAmong,
  overrides,
  splitMode,
  currency,
  payerName,
}: {
  parsedAmount: number
  splitAmong: string[]
  overrides: Record<string, string>
  splitMode: SplitOverrideMode
  currency: string
  payerName: string
}): SplitStatus {
  if (splitAmong.length === 0) {
    return {
      message: "Select at least one person to split with.",
      isValid: false,
    }
  }

  if (parsedAmount <= 0) {
    return { message: "", isValid: true }
  }

  const overrideEntries = splitAmong
    .filter((id) => overrides[id]?.trim())
    .map((id) => ({ id, raw: overrides[id] }))

  for (const { raw } of overrideEntries) {
    const num = Number(raw)
    if (!Number.isFinite(num) || num < 0) {
      return { message: "Values must be zero or positive.", isValid: false }
    }
    if (splitMode === "percent" && num > 100) {
      return {
        message: "Percentages must be 100 or less.",
        isValid: false,
      }
    }
  }

  const overrideSum = overrideEntries.reduce((sum, { raw }) => {
    const num = Number(raw)
    if (!Number.isFinite(num)) return sum
    return sum + (splitMode === "percent" ? (num / 100) * parsedAmount : num)
  }, 0)
  const remainder = round2(parsedAmount - overrideSum)
  const remainderCount = splitAmong.length - overrideEntries.length
  const total = formatAmount(currency, parsedAmount)

  if (remainder < -0.005) {
    return {
      message: `Overrides exceed ${total} by ${formatAmount(currency, -remainder)}.`,
      isValid: false,
    }
  }

  if (overrideEntries.length === 0) {
    return {
      message: `${splitAmong.length} ${peoplePlural(splitAmong.length)} split ${total} equally`,
      isValid: true,
    }
  }

  if (remainderCount === 0) {
    if (remainder > 0.01) {
      return {
        message: `Overrides fall short of ${total} by ${formatAmount(currency, remainder)}.`,
        isValid: false,
      }
    }
    if (remainder !== 0) {
      return {
        message: `${payerName} covers ${formatAmount(currency, Math.abs(remainder))} rounding`,
        isValid: true,
      }
    }
    return { message: `Overrides cover ${total}`, isValid: true }
  }

  return {
    message: `Remainder ${formatAmount(currency, remainder)} split equally (${remainderCount} ${peoplePlural(remainderCount)})`,
    isValid: true,
  }
}
