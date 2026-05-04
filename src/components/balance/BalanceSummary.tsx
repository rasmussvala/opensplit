import { ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { calculateBalances } from "@/lib/balances"
import { simplifyDebts } from "@/lib/simplify"
import type { DbExpense, DbGroupMember, DbSettlement } from "@/lib/types"
import { cn } from "@/lib/utils"
import BalanceList from "./BalanceList"
import SettlementList from "./SettlementList"

interface BalanceSummaryProps {
  expenses: DbExpense[]
  settlements: DbSettlement[]
  members: DbGroupMember[]
  currency: string
  inviteToken: string
  currentMemberId: string | null
}

export default function BalanceSummary({
  expenses,
  settlements,
  members,
  currency,
  inviteToken,
  currentMemberId,
}: BalanceSummaryProps) {
  const [showBalances, setShowBalances] = useState(true)
  const [onlyYou, setOnlyYou] = useState(false)
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
  const canFilterByCurrentMember = currentMemberId !== null
  const filteredTransactions =
    onlyYou && currentMemberId
      ? transactions.filter(
          (transaction) => transaction.from === currentMemberId,
        )
      : transactions

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

      {filteredTransactions.length > 0 ? (
        <SettlementList
          transactions={filteredTransactions}
          memberNames={memberNames}
          currency={currency}
          inviteToken={inviteToken}
          headerAction={
            canFilterByCurrentMember ? (
              <button
                type="button"
                aria-pressed={onlyYou}
                onClick={() => setOnlyYou((current) => !current)}
                className={cn(
                  "inline-flex items-center rounded-full border px-3 py-0.5 text-[12px] font-medium transition-all",
                  onlyYou
                    ? "border-primary/60 bg-primary/10 text-foreground shadow-xs"
                    : "border-border/70 bg-card/40 text-muted-foreground hover:border-border hover:bg-card/70 hover:text-foreground",
                )}
              >
                Only you
              </button>
            ) : null
          }
        />
      ) : (
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-sm">Settlements</h2>
            {canFilterByCurrentMember && (
              <button
                type="button"
                aria-pressed={onlyYou}
                onClick={() => setOnlyYou((current) => !current)}
                className={cn(
                  "inline-flex items-center rounded-full border px-3 py-0.5 text-[12px] font-medium transition-all",
                  onlyYou
                    ? "border-primary/60 bg-primary/10 text-foreground shadow-xs"
                    : "border-border/70 bg-card/40 text-muted-foreground hover:border-border hover:bg-card/70 hover:text-foreground",
                )}
              >
                Only you
              </button>
            )}
          </div>
          <div className="rounded-lg border p-4 text-center text-muted-foreground">
            You have no payments to make.
          </div>
        </div>
      )}
    </div>
  )
}
