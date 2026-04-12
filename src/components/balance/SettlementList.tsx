import { ArrowRight, Check } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { Transaction } from "@/lib/simplify"
import { formatAmount } from "@/lib/utils"

interface SettlementListProps {
  transactions: Transaction[]
  memberNames: Map<string, string>
  currency: string
  onSettle: (from: string, to: string, amount: number) => Promise<void>
}

const AVATAR_COLORS = [
  "bg-rose-400 dark:bg-rose-500",
  "bg-amber-400 dark:bg-amber-500",
  "bg-emerald-400 dark:bg-emerald-500",
  "bg-sky-400 dark:bg-sky-500",
  "bg-violet-400 dark:bg-violet-500",
  "bg-pink-400 dark:bg-pink-500",
  "bg-teal-400 dark:bg-teal-500",
  "bg-orange-400 dark:bg-orange-500",
  "bg-indigo-400 dark:bg-indigo-500",
  "bg-lime-400 dark:bg-lime-500",
]

function colorFor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function initialOf(name: string): string {
  return name.charAt(0).toUpperCase() || "?"
}

export default function SettlementList({
  transactions,
  memberNames,
  currency,
  onSettle,
}: SettlementListProps) {
  const [settlingKey, setSettlingKey] = useState<string | null>(null)

  async function handleSettle(from: string, to: string, amount: number) {
    const key = `${from}-${to}`
    setSettlingKey(key)
    try {
      await onSettle(from, to, amount)
    } finally {
      setSettlingKey(null)
    }
  }

  return (
    <div>
      <h2 className="mb-2 font-semibold text-sm">Settlements</h2>
      <div className="flex flex-col gap-2">
        {transactions.map((t) => {
          const key = `${t.from}-${t.to}`
          const fromName = memberNames.get(t.from) ?? t.from
          const toName = memberNames.get(t.to) ?? t.to
          const amountText = formatAmount(currency, t.amount)
          const [currencyCode, ...amountParts] = amountText.split(" ")
          const amountNumber = amountParts.join(" ")
          return (
            <div
              key={key}
              className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-border/70 bg-card/40 p-3 transition-colors hover:border-border hover:bg-card/70"
            >
              {/* Paired avatars with a directional flow arrow */}
              <div className="flex shrink-0 items-center">
                <div
                  aria-hidden="true"
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white shadow-sm ring-2 ring-background ${colorFor(t.from)}`}
                >
                  {initialOf(fromName)}
                </div>
                <div
                  aria-hidden="true"
                  className="relative z-1 -mx-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-background text-muted-foreground ring-1 ring-border transition-transform duration-200 group-hover:translate-x-0.5"
                >
                  <ArrowRight className="h-3 w-3" />
                </div>
                <div
                  aria-hidden="true"
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white shadow-sm ring-2 ring-background ${colorFor(t.to)}`}
                >
                  {initialOf(toName)}
                </div>
              </div>

              {/* Names label + amount */}
              <div className="flex min-w-0 flex-1 flex-col leading-tight">
                <span
                  aria-hidden="true"
                  className="truncate text-[10px] font-medium text-muted-foreground uppercase tracking-[0.14em]"
                >
                  {fromName}
                  <span className="mx-1 opacity-40">→</span>
                  {toName}
                </span>
                <span
                  aria-hidden="true"
                  className="mt-1 flex items-baseline gap-1.5 font-semibold text-[15px] text-foreground tabular-nums"
                >
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    {currencyCode}
                  </span>
                  <span className="truncate">{amountNumber}</span>
                </span>
              </div>

              {/* Accessible phrase (also used by existing tests) */}
              <span className="sr-only">
                {fromName} owes {toName} {amountText}
              </span>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSettle(t.from, t.to, t.amount)}
                disabled={settlingKey === key}
                className="gap-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                Settle
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
