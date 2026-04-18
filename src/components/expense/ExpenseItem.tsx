import MemberAvatar from "@/components/group/MemberAvatar"
import type { DbExpense } from "@/lib/types"
import { formatAmount } from "@/lib/utils"

interface ExpenseItemProps {
  expense: DbExpense
  currency: string
  getMemberName: (id: string) => string
}

const MAX_STACK_AVATARS = 4

export default function ExpenseItem({
  expense,
  currency,
  getMemberName,
}: ExpenseItemProps) {
  const createdAt = new Date(expense.created_at)
  const dateLabel = createdAt
    .toLocaleDateString("en", { month: "short", day: "numeric" })
    .toUpperCase()

  const payerName = getMemberName(expense.paid_by)
  const amountValue = Number(expense.amount)
  const amountText = formatAmount(currency, amountValue)
  const [currencyCode, ...amountParts] = amountText.split(" ")
  const amountNumber = amountParts.join(" ")

  const splitIds = expense.split_among
  const splitCount = splitIds.length
  const visibleAvatars = splitIds.slice(0, MAX_STACK_AVATARS)
  const extraAvatars = Math.max(0, splitCount - MAX_STACK_AVATARS)
  const splitNamesText = splitIds.map(getMemberName).join(", ")

  return (
    <div className="flex flex-col gap-1.5 leading-tight">
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate font-medium text-[15px] text-foreground">
          {expense.description}
        </span>
        <span
          aria-hidden="true"
          className="flex shrink-0 items-baseline gap-1 font-semibold text-[15px] text-foreground tabular-nums"
        >
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {currencyCode}
          </span>
          <span>{amountNumber}</span>
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-[10px] font-medium text-muted-foreground uppercase tracking-[0.14em]">
            {dateLabel}
          </span>
          <span
            aria-hidden="true"
            className="text-[10px] text-muted-foreground/40"
          >
            ·
          </span>
          <div aria-hidden="true" className="flex items-center -space-x-1">
            {visibleAvatars.map((id) => (
              <MemberAvatar
                key={id}
                id={id}
                name={getMemberName(id)}
                className="h-5 w-5 text-[9px] shadow-sm ring-2 ring-background"
              />
            ))}
            {extraAvatars > 0 && (
              <div className="relative flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[9px] font-semibold text-muted-foreground ring-2 ring-background">
                +{extraAvatars}
              </div>
            )}
          </div>
        </div>
        <div aria-hidden="true" className="flex shrink-0 items-center gap-1.5">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.14em]">
            Paid by
          </span>
          <MemberAvatar
            id={expense.paid_by}
            name={payerName}
            className="h-5 w-5 text-[9px] shadow-sm ring-2 ring-background"
          />
          <span className="truncate text-[11px] font-medium text-foreground">
            {payerName}
          </span>
        </div>
      </div>

      {/* Accessible labels — also relied on by list tests */}
      <span className="sr-only">{amountText}</span>
      <span className="sr-only">Paid by {payerName}</span>
      <span className="sr-only">Split: {splitNamesText}</span>
    </div>
  )
}
