import { Trash2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import type { Member, Settlement } from "@/application/groups/loadGroupSnapshot"
import { loadGroupSnapshot } from "@/application/groups/loadGroupSnapshot"
import { manageSettlements } from "@/application/settlements/manageSettlements"
import { useAuth } from "@/components/auth/AuthProvider"
import MemberPairAvatars from "@/components/group/MemberPairAvatars"
import BackLink from "@/components/ui/back-link"
import { Button } from "@/components/ui/button"
import CurrencyAmount from "@/components/ui/currency-amount"
import { LoadingState } from "@/components/ui/loading-state"
import { SupabaseGroupDataSource } from "@/infrastructure/supabase/supabaseGroupDataSource"
import { SupabaseSettlementDataSource } from "@/infrastructure/supabase/supabaseSettlementDataSource"
import { formatAmount } from "@/lib/utils"

type PageState =
  | { status: "loading" }
  | { status: "not-found" }
  | {
      status: "ready"
      groupId: string
      settlement: Settlement
      members: Member[]
      currency: string
    }

const groupLoader = loadGroupSnapshot(new SupabaseGroupDataSource())
const settlementManager = manageSettlements(new SupabaseSettlementDataSource())

export default function EditSettlementPage() {
  const { inviteToken, settlementId } = useParams<{
    inviteToken: string
    settlementId: string
  }>()
  const { userId } = useAuth()
  const navigate = useNavigate()
  const [state, setState] = useState<PageState>({ status: "loading" })
  const groupUrl = `/groups/${inviteToken}?tab=payments`

  const load = useCallback(async () => {
    try {
      const result = await groupLoader.execute({
        inviteToken: inviteToken as string,
        userId,
      })
      if (result.status !== "member") return setState({ status: "not-found" })
      const { snapshot } = result
      const settlement = snapshot.settlements.find(
        (item) => item.id === settlementId,
      )
      if (!settlement) return setState({ status: "not-found" })
      setState({
        status: "ready",
        groupId: snapshot.group.id,
        settlement,
        members: snapshot.members,
        currency: snapshot.group.currency,
      })
    } catch {
      setState({ status: "not-found" })
    }
  }, [inviteToken, settlementId, userId])

  useEffect(() => {
    void load()
  }, [load])

  async function handleDelete() {
    if (state.status !== "ready") return
    try {
      await settlementManager.delete(state.groupId, state.settlement.id)
      navigate(groupUrl)
    } catch {
      return
    }
  }

  if (state.status === "loading") return <LoadingState centered />
  if (state.status === "not-found")
    return <p className="p-6 text-center">Payment not found</p>

  const { settlement, members, currency } = state
  const memberNames = new Map(members.map((member) => [member.id, member.name]))
  const fromName = memberNames.get(settlement.from) ?? "Unknown"
  const toName = memberNames.get(settlement.to) ?? "Unknown"
  const settledAt = new Date(settlement.settledAt)
  const dateLabel = settledAt
    .toLocaleDateString("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase()

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-2 py-6">
      <BackLink to={groupUrl} />
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.14em]">
          {dateLabel}
        </span>
        <h2 className="font-semibold text-[22px] tracking-tight">Payment</h2>
      </div>
      <div className="flex items-center gap-3 overflow-hidden rounded-xl border border-border/70 bg-card/40 p-4">
        <MemberPairAvatars
          from={{ id: settlement.from, name: fromName }}
          to={{ id: settlement.to, name: toName }}
        />
        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate text-[10px] font-medium text-muted-foreground uppercase tracking-[0.14em]">
            {fromName}
            <span className="mx-1 opacity-40">→</span>
            {toName}
          </span>
          <span className="mt-1 text-[10px] font-medium text-muted-foreground uppercase tracking-[0.14em]">
            {dateLabel}
          </span>
        </div>
        <CurrencyAmount currency={currency} amount={settlement.amount} />
        <span className="sr-only">
          {fromName} paid {toName} {formatAmount(currency, settlement.amount)}{" "}
          on {dateLabel}
        </span>
      </div>
      <Button
        type="button"
        variant="destructive"
        onClick={handleDelete}
        className="w-full"
      >
        <Trash2 className="h-4 w-4" />
        Delete payment
      </Button>
    </div>
  )
}
