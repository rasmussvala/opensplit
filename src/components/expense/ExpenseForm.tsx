import { Check, Trash2 } from "lucide-react"
import { useState } from "react"
import MemberAvatar from "@/components/group/MemberAvatar"
import { Button } from "@/components/ui/button"
import { computeShares } from "@/lib/balances"
import type {
  DbGroupMember,
  SplitOverrideMode,
  SplitOverrides,
} from "@/lib/types"
import { cn, formatAmount } from "@/lib/utils"

export interface ExpenseFormData {
  description: string
  amount: number
  paidBy: string
  splitAmong: string[]
}

interface ExpenseFormProps {
  members: DbGroupMember[]
  currency: string
  initialDescription?: string
  initialAmount?: string
  initialPaidBy?: string
  initialSplitAmong?: string[]
  submitLabel: string
  onSubmit: (data: ExpenseFormData) => void | Promise<void>
  onCancel?: () => void
  onDelete?: () => void
}

const INPUT_PATTERN = /^\d*\.?\d{0,2}$/

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function formatRaw(value: number): string {
  if (!Number.isFinite(value)) return ""
  return round2(value).toString()
}

export default function ExpenseForm({
  members,
  currency,
  initialDescription = "",
  initialAmount = "",
  initialPaidBy,
  initialSplitAmong,
  submitLabel,
  onSubmit,
  onCancel,
  onDelete,
}: ExpenseFormProps) {
  const [description, setDescription] = useState(initialDescription)
  const [amount, setAmount] = useState(initialAmount)
  const [paidBy, setPaidBy] = useState(initialPaidBy ?? members[0]?.id ?? "")
  const [splitAmong, setSplitAmong] = useState<string[]>(
    initialSplitAmong ?? members.map((m) => m.id),
  )
  const [splitMode, setSplitMode] = useState<SplitOverrideMode>("percent")
  const [overrides, setOverrides] = useState<Record<string, string>>({})

  const parsedAmount = Number(amount) || 0

  const activeOverrides = buildActiveOverrides(overrides, splitAmong, splitMode)

  const shares =
    parsedAmount > 0 && splitAmong.length > 0
      ? computeShares({
          paid_by: paidBy,
          amount: parsedAmount,
          split_among: splitAmong,
          split_overrides: activeOverrides,
        })
      : {}

  function toggleMember(memberId: string) {
    setSplitAmong((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId],
    )
    setOverrides((prev) => {
      if (!(memberId in prev)) return prev
      const next = { ...prev }
      delete next[memberId]
      return next
    })
  }

  function handleModeChange(nextMode: SplitOverrideMode) {
    if (nextMode === splitMode) return
    setOverrides((prev) => {
      if (parsedAmount <= 0) return prev
      const next: Record<string, string> = {}
      for (const [memberId, raw] of Object.entries(prev)) {
        const num = Number(raw)
        if (!raw.trim() || !Number.isFinite(num)) {
          next[memberId] = raw
          continue
        }
        const converted =
          splitMode === "percent" && nextMode === "amount"
            ? (num / 100) * parsedAmount
            : splitMode === "amount" && nextMode === "percent"
              ? (num / parsedAmount) * 100
              : num
        next[memberId] = formatRaw(converted)
      }
      return next
    })
    setSplitMode(nextMode)
  }

  function handleOverrideChange(memberId: string, raw: string) {
    if (raw !== "" && !INPUT_PATTERN.test(raw)) return
    setOverrides((prev) => ({ ...prev, [memberId]: raw }))
  }

  function handleOverrideBlur(memberId: string) {
    const raw = overrides[memberId]
    if (raw === undefined) return
    if (!raw.trim()) {
      setOverrides((prev) => {
        const next = { ...prev }
        delete next[memberId]
        return next
      })
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim() || !parsedAmount || splitAmong.length === 0) return
    onSubmit({
      description: description.trim(),
      amount: parsedAmount,
      paidBy,
      splitAmong,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Hero amount card */}
      <div className="rounded-xl border border-border/70 bg-card/40 p-4">
        <label
          htmlFor="expense-amount"
          className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.14em]"
        >
          Amount
        </label>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            {currency}
          </span>
          <input
            id="expense-amount"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full min-w-0 flex-1 bg-transparent font-semibold text-3xl tabular-nums tracking-tight outline-none placeholder:text-muted-foreground/30"
          />
        </div>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="expense-description"
          className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.14em]"
        >
          Description
        </label>
        <input
          id="expense-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What was it for?"
          className="flex h-10 w-full rounded-lg border border-border/70 bg-card/40 px-3 text-base shadow-xs outline-none transition-colors placeholder:text-muted-foreground/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 md:text-sm"
        />
      </div>

      {/* Paid by — pill picker */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.14em]">
          Paid by
        </span>
        <div className="flex flex-wrap gap-1.5">
          {members.map((m) => {
            const selected = paidBy === m.id
            return (
              <button
                key={m.id}
                type="button"
                aria-label={`Paid by ${m.guest_name}`}
                aria-pressed={selected}
                onClick={() => setPaidBy(m.id)}
                className={cn(
                  "group/pill inline-flex items-center gap-1.5 rounded-full border py-0.5 pr-3 pl-0.5 text-[12px] font-medium transition-all",
                  selected
                    ? "border-primary/60 bg-primary/10 text-foreground shadow-xs"
                    : "border-border/70 bg-card/40 text-muted-foreground hover:border-border hover:bg-card/70 hover:text-foreground",
                )}
              >
                <MemberAvatar
                  id={m.id}
                  name={m.guest_name}
                  className={cn(
                    "h-6 w-6 text-[10px] ring-2 ring-background transition-transform",
                    selected && "ring-primary/30",
                  )}
                />
                <span>{m.guest_name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Split among — tappable list */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.14em]">
            Split among
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { mode: "percent" as const, label: "%" },
              { mode: "amount" as const, label: currency },
            ].map(({ mode, label }) => {
              const selected = splitMode === mode
              return (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => handleModeChange(mode)}
                  className={cn(
                    "inline-flex items-center rounded-full border px-3 py-0.5 text-[12px] font-medium transition-all",
                    selected
                      ? "border-primary/60 bg-primary/10 text-foreground shadow-xs"
                      : "border-border/70 bg-card/40 text-muted-foreground hover:border-border hover:bg-card/70 hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
        <div className="flex flex-col overflow-hidden rounded-xl border border-border/70 bg-card/40">
          {members.map((m, i) => {
            const checked = splitAmong.includes(m.id)
            const shareValue = shares[m.id]
            const isOverride = m.id in overrides
            const shareNumber =
              checked && shareValue !== undefined
                ? formatAmount(currency, shareValue)
                    .split(" ")
                    .slice(1)
                    .join(" ")
                : null

            let inputValue = ""
            if (checked) {
              if (isOverride) {
                inputValue = overrides[m.id]
              } else if (parsedAmount > 0 && shareValue !== undefined) {
                const autoValue =
                  splitMode === "percent"
                    ? (shareValue / parsedAmount) * 100
                    : shareValue
                inputValue = formatRaw(autoValue)
              }
            }

            return (
              <label
                key={m.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-card/70",
                  i > 0 && "border-t border-border/50",
                )}
              >
                <input
                  type="checkbox"
                  aria-label={m.guest_name}
                  checked={checked}
                  onChange={() => toggleMember(m.id)}
                  className="sr-only"
                />
                <MemberAvatar
                  id={m.id}
                  name={m.guest_name}
                  className="h-7 w-7 text-[11px] shadow-sm ring-2 ring-background"
                />
                <div className="flex min-w-0 flex-1 flex-col leading-tight">
                  <span
                    className={cn(
                      "text-sm",
                      isOverride ? "font-semibold" : "font-medium",
                    )}
                  >
                    {m.guest_name}
                  </span>
                  {shareNumber && (
                    <span
                      data-testid={`share-${m.id}`}
                      className="text-[11px] text-muted-foreground tabular-nums"
                    >
                      {shareNumber} {currency}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    inputMode="decimal"
                    aria-label={`${m.guest_name} share`}
                    value={inputValue}
                    disabled={!checked}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleOverrideChange(m.id, e.target.value)}
                    onBlur={() => handleOverrideBlur(m.id)}
                    className={cn(
                      "w-24 rounded-md border border-border/70 bg-background/60 px-2 py-1 text-right text-base tabular-nums outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-40",
                      isOverride ? "font-semibold" : "font-normal",
                    )}
                  />
                  <span className="w-6 text-[10px] text-muted-foreground uppercase tracking-wider">
                    {splitMode === "percent" ? "%" : currency}
                  </span>
                </div>
                <div
                  aria-hidden="true"
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border transition-colors",
                    checked
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/80 bg-background",
                  )}
                >
                  {checked && <Check className="h-3.5 w-3.5" />}
                </div>
              </label>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <Button type="submit" className="flex-1">
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        {onDelete && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            aria-label="Delete"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </form>
  )
}

function buildActiveOverrides(
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
