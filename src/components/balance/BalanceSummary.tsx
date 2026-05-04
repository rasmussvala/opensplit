import { ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
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
  inviteToken: string
}

export default function BalanceSummary({
  expenses,
  settlements,
  members,
  currency,
  inviteToken,
}: BalanceSummaryProps) {
  const [showBalances, setShowBalances] = useState(false)
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
      <section
        className="flex flex-col gap-2"
        aria-labelledby="balances-heading"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 id="balances-heading" className="font-semibold text-sm">
            Balances
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-expanded={showBalances}
            aria-label={showBalances ? "Hide balances" : "Show balances"}
            onClick={() => setShowBalances((current) => !current)}
          >
            {showBalances ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </div>

        {showBalances && (
          <BalanceList
            balances={balances}
            memberNames={memberNames}
            currency={currency}
          />
        )}
      </section>
      <SettlementList
        transactions={transactions}
        memberNames={memberNames}
        currency={currency}
        inviteToken={inviteToken}
      />
    </div>
  )
}
