import { ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"
import MemberPairAvatars from "@/components/group/MemberPairAvatars"
import CurrencyAmount from "@/components/ui/currency-amount"
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
          const fromName = memberNames.get(t.from) ?? t.from
          const toName = memberNames.get(t.to) ?? t.to
          return (
            <Link
              key={`${t.from}-${t.to}`}
              to={`/groups/${inviteToken}/settle/${t.from}/${t.to}`}
              className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-border/70 bg-card/40 p-3 transition-colors hover:border-border hover:bg-card/70"
            >
              <MemberPairAvatars
                from={{ id: t.from, name: fromName }}
                to={{ id: t.to, name: toName }}
                hoverNudge
              />

              <div
                aria-hidden="true"
                className="flex min-w-0 flex-1 flex-col leading-tight"
              >
                <span className="truncate text-[10px] font-medium text-muted-foreground uppercase tracking-[0.14em]">
                  {fromName}
                  <span className="mx-1 opacity-40">→</span>
                  {toName}
                </span>
                <span className="mt-1">
                  <CurrencyAmount currency={currency} amount={t.amount} />
                </span>
              </div>

              <span className="sr-only">
                {fromName} owes {toName} {formatAmount(currency, t.amount)}
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
