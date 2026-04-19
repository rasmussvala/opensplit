import { calculateBalances } from "@/lib/balances"
import { simplifyDebts } from "@/lib/simplify"
import type { DbExpense, DbGroupMember, DbSettlement } from "@/lib/types"
import BalanceList from "./BalanceList"
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
    split_overrides: e.split_overrides,
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

  return (
    <div className="flex flex-col gap-4">
      <BalanceList
        balances={balances}
        memberNames={memberNames}
        currency={currency}
      />
      <SettlementList
        transactions={transactions}
        memberNames={memberNames}
        currency={currency}
        onSettle={onSettle}
      />
    </div>
  )
}
