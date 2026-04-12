import { ArrowRight } from "lucide-react"
import MemberAvatar from "@/components/group/MemberAvatar"
import type { DbGroupMember, DbSettlement } from "@/lib/types"
import { formatAmount } from "@/lib/utils"

interface PaymentsListProps {
  settlements: DbSettlement[]
  members: DbGroupMember[]
  currency: string
}

export default function PaymentsList({
  settlements,
  members,
  currency,
}: PaymentsListProps) {
  const memberNames = new Map(members.map((m) => [m.id, m.guest_name]))

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
    (a, b) =>
      new Date(b.settled_at).getTime() - new Date(a.settled_at).getTime(),
  )

  return (
    <div>
      <h2 className="mb-2 font-semibold text-sm">Payments</h2>
      <div className="flex flex-col gap-2">
        {ordered.map((settlement) => {
          const fromName = memberNames.get(settlement.from_member) ?? "Unknown"
          const toName = memberNames.get(settlement.to_member) ?? "Unknown"
          const amountValue = Number(settlement.amount)
          const amountText = formatAmount(currency, amountValue)
          const [currencyCode, ...amountParts] = amountText.split(" ")
          const amountNumber = amountParts.join(" ")
          const settledAt = new Date(settlement.settled_at)
          const dateLabel = settledAt
            .toLocaleDateString("en", { month: "short", day: "numeric" })
            .toUpperCase()

          return (
            <div
              key={settlement.id}
              className="group relative flex items-center gap-3 overflow-hidden rounded-xl border border-border/70 bg-card/40 p-3 transition-colors hover:border-border hover:bg-card/70"
            >
              <div aria-hidden="true" className="flex shrink-0 items-center">
                <MemberAvatar
                  id={settlement.from_member}
                  name={fromName}
                  className="h-9 w-9 shadow-sm ring-2 ring-background"
                />
                <div className="relative z-1 -mx-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-background text-muted-foreground ring-1 ring-border transition-transform duration-200 group-hover:translate-x-0.5">
                  <ArrowRight className="h-3 w-3" />
                </div>
                <MemberAvatar
                  id={settlement.to_member}
                  name={toName}
                  className="h-9 w-9 shadow-sm ring-2 ring-background"
                />
              </div>

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
                  className="mt-1 flex items-center justify-between gap-2"
                >
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.14em]">
                    {dateLabel}
                  </span>
                </span>
              </div>

              <span
                aria-hidden="true"
                className="flex shrink-0 items-baseline gap-1 font-semibold text-[15px] text-foreground tabular-nums"
              >
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {currencyCode}
                </span>
                <span>{amountNumber}</span>
              </span>

              <span className="sr-only">
                {fromName} paid {toName} {amountText} on {dateLabel}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
