import { ArrowRight, ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"
import MemberAvatar from "@/components/group/MemberAvatar"
import type { Transaction } from "@/lib/simplify"
import { formatAmount } from "@/lib/utils"

interface SettlementListProps {
  transactions: Transaction[]
  memberNames: Map<string, string>
  currency: string
  inviteToken: string
}

export default function SettlementList({
  transactions,
  memberNames,
  currency,
  inviteToken,
}: SettlementListProps) {
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
            <Link
              key={key}
              to={`/groups/${inviteToken}/settle/${t.from}/${t.to}`}
              className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-border/70 bg-card/40 p-3 transition-colors hover:border-border hover:bg-card/70"
            >
              <div aria-hidden="true" className="flex shrink-0 items-center">
                <MemberAvatar
                  id={t.from}
                  name={fromName}
                  className="h-9 w-9 shadow-sm ring-2 ring-background"
                />
                <div className="relative z-1 -mx-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-background text-muted-foreground ring-1 ring-border transition-transform duration-200 group-hover:translate-x-0.5">
                  <ArrowRight className="h-3 w-3" />
                </div>
                <MemberAvatar
                  id={t.to}
                  name={toName}
                  className="h-9 w-9 shadow-sm ring-2 ring-background"
                />
              </div>

              <div
                aria-hidden="true"
                className="flex min-w-0 flex-1 flex-col leading-tight"
              >
                <span className="truncate text-[10px] font-medium text-muted-foreground uppercase tracking-[0.14em]">
                  {fromName}
                  <span className="mx-1 opacity-40">→</span>
                  {toName}
                </span>
                <span className="mt-1 flex items-baseline gap-1.5 font-semibold text-[15px] text-foreground tabular-nums">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                    {currencyCode}
                  </span>
                  <span className="truncate">{amountNumber}</span>
                </span>
              </div>

              <span className="sr-only">
                {fromName} owes {toName} {amountText}
              </span>

              <ChevronRight
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
