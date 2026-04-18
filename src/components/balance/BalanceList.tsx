import BalanceItem from "./BalanceItem"

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
          return (
            <BalanceItem
              key={row.memberId}
              memberId={row.memberId}
              name={row.name}
              balance={row.balance}
              currency={currency}
              maxMagnitude={maxMagnitude}
            />
          )
        })}
      </div>
    </div>
  )
}
