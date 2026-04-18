import MemberAvatar from "@/components/group/MemberAvatar"
import { formatAmount } from "@/lib/utils"

interface BalanceListProps {
  balances: Record<string, number>
  memberNames: Map<string, string>
  currency: string
}

interface BalanceRow {
  memberId: string
  name: string
  balance: number
}

export default function BalanceList({
  balances,
  memberNames,
  currency,
}: BalanceListProps) {
  const rows: BalanceRow[] = Object.entries(balances)
    .filter(([, value]) => Math.abs(value) >= 0.01)
    .map(([memberId, balance]) => ({
      memberId,
      name: memberNames.get(memberId) ?? memberId,
      balance,
    }))
    .sort((a, b) => b.balance - a.balance)

  if (rows.length === 0) return null

  const maxMagnitude = rows.reduce(
    (max, r) => Math.max(max, Math.abs(r.balance)),
    0,
  )

  return (
    <div>
      <h2 className="mb-2 font-semibold text-sm">Balances</h2>
      <div className="flex flex-col gap-2">
        {rows.map((row) => {
          const isCredit = row.balance > 0
          const widthPct =
            maxMagnitude > 0
              ? Math.max(4, (Math.abs(row.balance) / maxMagnitude) * 100)
              : 0
          const amountText = formatAmount(currency, Math.abs(row.balance))
          const [currencyCode, ...amountParts] = amountText.split(" ")
          const amountNumber = amountParts.join(" ")

          return (
            <div
              key={row.memberId}
              data-testid={`balance-${row.memberId}`}
              className={
                isCredit
                  ? "relative flex items-center gap-3 overflow-hidden rounded-xl border border-border/70 bg-card/40 p-3 text-positive"
                  : "relative flex items-center gap-3 overflow-hidden rounded-xl border border-border/70 bg-card/40 p-3 text-destructive"
              }
            >
              <MemberAvatar
                id={row.memberId}
                name={row.name}
                className="h-9 w-9 shadow-sm ring-2 ring-background"
              />

              {/* Name + magnitude bar */}
              <div className="flex min-w-0 flex-1 flex-col gap-1.5 leading-tight">
                <span className="truncate font-medium text-[13px] text-foreground">
                  {row.name}
                </span>
                <div className="relative h-1 w-full overflow-hidden rounded-full bg-muted/60">
                  <div
                    className={
                      isCredit
                        ? "absolute inset-y-0 left-0 rounded-full bg-positive/80"
                        : "absolute inset-y-0 left-0 rounded-full bg-destructive/80"
                    }
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>

              {/* Amount */}
              <div
                aria-hidden="true"
                className="flex shrink-0 items-baseline gap-1 font-semibold text-[15px] tabular-nums"
              >
                <span className="text-[11px] opacity-70">
                  {isCredit ? "+" : "−"}
                </span>
                <span className="text-[10px] font-medium uppercase tracking-wider opacity-70">
                  {currencyCode}
                </span>
                <span>{amountNumber}</span>
              </div>

              {/* Accessible amount for screen readers / tests */}
              <span className="sr-only">
                {row.name}: {isCredit ? "+" : "-"}
                {amountText}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
