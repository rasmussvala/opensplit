import { calculateBalances } from "@/lib/balances"
import { simplifyDebts } from "@/lib/simplify"
import type { DbExpense, DbGroupMember, DbSettlement } from "@/lib/types"
import { formatAmount } from "@/lib/utils"
import SettlementList from "./SettlementList"

interface BalanceSummaryProps {
  expenses: DbExpense[]
  settlements: DbSettlement[]
  members: DbGroupMember[]
  currency: string
  onSettle: (from: string, to: string, amount: number) => Promise<void>
}

export default function BalanceSummary({
  expenses,
  settlements,
  members,
  currency,
  onSettle,
}: BalanceSummaryProps) {
  const memberNames = new Map(members.map((m) => [m.id, m.guest_name]))

  const mappedExpenses = expenses.map((e) => ({
    paid_by: e.paid_by,
    amount: Number(e.amount),
    split_among: e.split_among,
  }))

  const mappedSettlements = settlements.map((s) => ({
    from: s.from_member,
    to: s.to_member,
    amount: Number(s.amount),
  }))

  const balances = calculateBalances(mappedExpenses, mappedSettlements)
  const transactions = simplifyDebts(balances)

  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border p-4 text-center text-muted-foreground">
        All settled up!
      </div>
    )
  }

  const nonZeroBalances = Object.entries(balances).filter(
    ([, value]) => Math.abs(value) >= 0.01,
  )

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="mb-2 font-semibold text-sm">Balances</h2>
        <div className="flex flex-col gap-1">
          {nonZeroBalances.map(([memberId, balance]) => (
            <div
              key={memberId}
              data-testid={`balance-${memberId}`}
              className={balance > 0 ? "text-green-400" : "text-red-400"}
            >
              {memberNames.get(memberId) ?? memberId}: {balance > 0 ? "+" : "-"}
              {formatAmount(currency, Math.abs(balance))}
            </div>
          ))}
        </div>
      </div>

      <SettlementList
        transactions={transactions}
        memberNames={memberNames}
        currency={currency}
        onSettle={onSettle}
      />
    </div>
  )
}
