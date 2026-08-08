import { Link } from "react-router-dom"
import type { Member, Settlement } from "@/application/groups/loadGroupSnapshot"
import MemberPairAvatars from "@/components/group/MemberPairAvatars"
import CurrencyAmount from "@/components/ui/currency-amount"
import { formatAmount } from "@/lib/utils"

interface PaymentsListProps {
  settlements: Settlement[]
  members: Member[]
  currency: string
  inviteToken: string
}

export default function PaymentsList({
  settlements,
  members,
  currency,
  inviteToken,
}: PaymentsListProps) {
  const memberNames = new Map(members.map((m) => [m.id, m.name]))

  if (settlements.length === 0) {
    return (
      <div>
        <h2 className="mb-2 font-semibold text-sm">Payments</h2>
        <p className="rounded-xl border border-border/70 border-dashed bg-card/20 p-4 text-center text-muted-foreground text-sm">
          No payments yet
        </p>
      </div>
    )
  }

  const ordered = [...settlements].sort(
    (a, b) => new Date(b.settledAt).getTime() - new Date(a.settledAt).getTime(),
  )

  return (
    <div>
      <h2 className="mb-2 font-semibold text-sm">Payments</h2>
      <div className="flex flex-col gap-2">
        {ordered.map((settlement) => {
          const fromName = memberNames.get(settlement.from) ?? "Unknown"
          const toName = memberNames.get(settlement.to) ?? "Unknown"
          const amountValue = settlement.amount
          const settledAt = new Date(settlement.settledAt)
          const dateLabel = settledAt
            .toLocaleDateString("en", { month: "short", day: "numeric" })
            .toUpperCase()

          return (
            <Link
              key={settlement.id}
              to={`/groups/${inviteToken}/settlements/${settlement.id}`}
              className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-border/70 bg-card/40 p-3 transition-colors hover:border-border hover:bg-card/70"
            >
              <MemberPairAvatars
                from={{ id: settlement.from, name: fromName }}
                to={{ id: settlement.to, name: toName }}
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
                <span className="mt-1 flex items-center justify-between gap-2">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.14em]">
                    {dateLabel}
                  </span>
                </span>
              </div>

              <span aria-hidden="true">
                <CurrencyAmount currency={currency} amount={amountValue} />
              </span>

              <span className="sr-only">
                {fromName} paid {toName} {formatAmount(currency, amountValue)}{" "}
                on {dateLabel}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
