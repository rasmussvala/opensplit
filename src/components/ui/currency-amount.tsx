import { formatAmountNumber } from "@/lib/utils"

interface CurrencyAmountProps {
  currency: string
  amount: number
}

export default function CurrencyAmount({
  currency,
  amount,
}: CurrencyAmountProps) {
  return (
    <span className="flex shrink-0 items-baseline gap-1 font-semibold text-[15px] text-foreground tabular-nums">
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        {currency}
      </span>
      <span>{formatAmountNumber(amount)}</span>
    </span>
  )
}
