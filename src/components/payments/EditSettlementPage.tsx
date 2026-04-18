import { ArrowLeft, ArrowRight, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useAuth } from "@/components/auth/AuthProvider"
import MemberAvatar from "@/components/group/MemberAvatar"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/ui/loading-state"
import { supabase } from "@/lib/supabase"
import type { DbGroupMember, DbSettlement } from "@/lib/types"
import { formatAmount } from "@/lib/utils"

type PageState =
  | { status: "loading" }
  | { status: "not-found" }
  | {
      status: "ready"
      settlement: DbSettlement
      members: DbGroupMember[]
      currency: string
    }

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
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select()
      .eq("invite_token", inviteToken as string)
      .single()

    if (groupError || !group) {
      setState({ status: "not-found" })
      return
    }

    const { data: membership } = await supabase
      .from("group_members")
      .select()
      .eq("group_id", group.id)
      .eq("user_id", userId)
      .maybeSingle()

    if (!membership) {
      setState({ status: "not-found" })
      return
    }

    const [{ data: members }, { data: settlement }] = await Promise.all([
      supabase.from("group_members").select().eq("group_id", group.id),
      supabase
        .from("settlements")
        .select()
        .eq("id", settlementId as string)
        .single(),
    ])

    if (!settlement) {
      setState({ status: "not-found" })
      return
    }

    setState({
      status: "ready",
      settlement: settlement as DbSettlement,
      members: members ?? [],
      currency: group.currency,
    })
  }, [inviteToken, settlementId, userId])

  useEffect(() => {
    load()
  }, [load])

  async function handleDelete() {
    if (state.status !== "ready") return

    const { error } = await supabase
      .from("settlements")
      .delete()
      .eq("id", state.settlement.id)

    if (error) return
    navigate(groupUrl)
  }

  if (state.status === "loading") {
    return <LoadingState centered />
  }

  if (state.status === "not-found") {
    return <p className="p-6 text-center">Payment not found</p>
  }

  const { settlement, members, currency } = state
  const memberNames = new Map(members.map((m) => [m.id, m.guest_name]))
  const fromName = memberNames.get(settlement.from_member) ?? "Unknown"
  const toName = memberNames.get(settlement.to_member) ?? "Unknown"
  const amountValue = Number(settlement.amount)
  const amountText = formatAmount(currency, amountValue)
  const [currencyCode, ...amountParts] = amountText.split(" ")
  const amountNumber = amountParts.join(" ")
  const settledAt = new Date(settlement.settled_at)
  const dateLabel = settledAt
    .toLocaleDateString("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    .toUpperCase()

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-2 py-6">
      <Link
        to={groupUrl}
        className="group inline-flex w-fit items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.14em] transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        Back
      </Link>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.14em]">
          {dateLabel}
        </span>
        <h2 className="font-semibold text-[22px] tracking-tight">Payment</h2>
      </div>

      <div className="flex items-center gap-3 overflow-hidden rounded-xl border border-border/70 bg-card/40 p-4">
        <div aria-hidden="true" className="flex shrink-0 items-center">
          <MemberAvatar
            id={settlement.from_member}
            name={fromName}
            className="h-9 w-9 shadow-sm ring-2 ring-background"
          />
          <div className="relative z-1 -mx-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-background text-muted-foreground ring-1 ring-border">
            <ArrowRight className="h-3 w-3" />
          </div>
          <MemberAvatar
            id={settlement.to_member}
            name={toName}
            className="h-9 w-9 shadow-sm ring-2 ring-background"
          />
        </div>

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

        <span className="flex shrink-0 items-baseline gap-1 font-semibold text-[15px] text-foreground tabular-nums">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {currencyCode}
          </span>
          <span>{amountNumber}</span>
        </span>

        <span className="sr-only">
          {fromName} paid {toName} {amountText} on {dateLabel}
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
