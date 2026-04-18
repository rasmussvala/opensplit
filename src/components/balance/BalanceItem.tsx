import MemberAvatar from "@/components/group/MemberAvatar"
import { formatAmount } from "@/lib/utils"

interface BalanceItemProps {
  memberId: string
  name: string
  balance: number
  currency: string
  maxMagnitude: number
}

export default function BalanceItem({
  memberId,
  name,
  balance,
  currency,
  maxMagnitude,
}: BalanceItemProps) {
  const isCredit = balance > 0
  const widthPct =
    maxMagnitude > 0 ? Math.max(4, (Math.abs(balance) / maxMagnitude) * 100) : 0
  const amountText = formatAmount(currency, Math.abs(balance))
  const [currencyCode, ...amountParts] = amountText.split(" ")
  const amountNumber = amountParts.join(" ")

  return (
    <div
      data-testid={`balance-${memberId}`}
      className={
        isCredit
          ? "relative flex items-center gap-3 overflow-hidden rounded-xl border border-border/70 bg-card/40 p-3 text-positive"
          : "relative flex items-center gap-3 overflow-hidden rounded-xl border border-border/70 bg-card/40 p-3 text-destructive"
      }
    >
      <MemberAvatar
        id={memberId}
        name={name}
        className="h-9 w-9 shadow-sm ring-2 ring-background"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 leading-tight">
        <span className="truncate font-medium text-[13px] text-foreground">
          {name}
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

      <div
        aria-hidden="true"
        className="flex shrink-0 items-baseline gap-1 font-semibold text-[15px] tabular-nums"
      >
        <span className="text-[11px] opacity-70">{isCredit ? "+" : "−"}</span>
        <span className="text-[10px] font-medium uppercase tracking-wider opacity-70">
          {currencyCode}
        </span>
        <span>{amountNumber}</span>
      </div>

      <span className="sr-only">
        {name}: {isCredit ? "+" : "-"}
        {amountText}
      </span>
    </div>
  )
}
