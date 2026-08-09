import { Check, Copy, Smartphone } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import type {
  Group,
  GroupSnapshot,
  LoadGroupResult,
  Member,
} from "@/application/groups/loadGroupSnapshot"
import { loadGroupSnapshot } from "@/application/groups/loadGroupSnapshot"
import { manageSettlements } from "@/application/settlements/manageSettlements"
import { useAuth } from "@/components/auth/AuthProvider"
import MemberPairAvatars from "@/components/group/MemberPairAvatars"
import BackLink from "@/components/ui/back-link"
import { Button, buttonVariants } from "@/components/ui/button"
import CurrencyAmount from "@/components/ui/currency-amount"
import { LoadingState } from "@/components/ui/loading-state"
import { SupabaseGroupDataSource } from "@/infrastructure/supabase/supabaseGroupDataSource"
import { SupabaseSettlementDataSource } from "@/infrastructure/supabase/supabaseSettlementDataSource"
import { supabase } from "@/lib/supabase"
import {
  buildSwishDeepLink,
  buildSwishMessage,
  buildSwishQrPayload,
  formatSwishAmount,
  isMobileSwishDevice,
  isSwishCurrency,
} from "@/lib/swish"
import { cn, formatAmount } from "@/lib/utils"

type PageState =
  | { status: "loading" }
  | { status: "not-found" }
  | {
      status: "ready"
      group: Group
      snapshot: GroupSnapshot
      from: Member
      to: Member
      amount: number | null
    }

const groupLoader = loadGroupSnapshot(new SupabaseGroupDataSource())
const settlementManager = manageSettlements(new SupabaseSettlementDataSource())

export default function SettlePage() {
  const { inviteToken, fromMemberId, toMemberId } = useParams<{
    inviteToken: string
    fromMemberId: string
    toMemberId: string
  }>()
  const { userId } = useAuth()
  const navigate = useNavigate()
  const [state, setState] = useState<PageState>({ status: "loading" })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  const groupUrl = `/groups/${inviteToken}?tab=balances`

  const load = useCallback(async () => {
    let result: LoadGroupResult
    try {
      result = await groupLoader.execute({
        inviteToken: inviteToken as string,
        userId,
      })
    } catch {
      setState({ status: "not-found" })
      return
    }
    if (result.status !== "member") {
      setState({ status: "not-found" })
      return
    }
    const { snapshot } = result
    const from = snapshot.members.find((m) => m.id === fromMemberId)
    const to = snapshot.members.find((m) => m.id === toMemberId)

    if (!from || !to) {
      setState({ status: "not-found" })
      return
    }

    const match = (await settlementManager.suggest(snapshot)).find(
      (t) => t.from === fromMemberId && t.to === toMemberId,
    )

    setState({
      status: "ready",
      group: snapshot.group,
      snapshot,
      from,
      to,
      amount: match ? match.amount : null,
    })
  }, [inviteToken, fromMemberId, toMemberId, userId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!inviteToken) return
    const channel = supabase
      .channel(`settle-${inviteToken}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses" },
        () => void load(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "settlements" },
        () => void load(),
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [inviteToken, load])

  const ready = state.status === "ready" ? state : null
  const swishEnabled =
    !!ready &&
    ready.amount !== null &&
    isSwishCurrency(ready.group.currency) &&
    !!ready.to.swishPhone

  const qrPhone = swishEnabled ? (ready?.to.swishPhone ?? null) : null
  const qrAmount = swishEnabled && ready?.amount ? ready.amount : null
  const qrGroupName = swishEnabled ? (ready?.group.name ?? null) : null

  useEffect(() => {
    if (!qrPhone || qrAmount === null || qrGroupName === null) {
      setQrDataUrl(null)
      return
    }
    const payload = buildSwishQrPayload({
      phone: qrPhone,
      amount: formatSwishAmount(qrAmount),
      message: buildSwishMessage(qrGroupName),
    })
    let cancelled = false
    import("qrcode")
      .then((mod) => mod.default.toDataURL(payload, { margin: 1, width: 220 }))
      .then((url) => {
        if (!cancelled) setQrDataUrl(url)
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null)
      })
    return () => {
      cancelled = true
    }
  }, [qrPhone, qrAmount, qrGroupName])

  async function handleCopyAmount() {
    if (state.status !== "ready" || state.amount === null) return
    try {
      await navigator.clipboard.writeText(formatSwishAmount(state.amount))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }

  async function handleMarkSettled() {
    if (state.status !== "ready" || state.amount === null) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const result = await settlementManager.record({
        groupId: state.group.id,
        from: state.from.id,
        to: state.to.id,
        amount: state.amount,
        snapshot: state.snapshot,
      })
      if (result.status !== "recorded") {
        setSubmitError(
          result.status === "exceeds-outstanding"
            ? "The outstanding amount changed. Please go back and try again."
            : "This settlement is no longer outstanding. Please go back and try again.",
        )
        return
      }
      navigate(`/groups/${inviteToken}?tab=payments`)
    } catch {
      setSubmitError("Unable to record settlement. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (state.status === "loading") {
    return <LoadingState centered />
  }

  if (state.status === "not-found") {
    return <p className="p-6 text-center">Settlement not found</p>
  }

  const { group, from, to, amount } = state

  if (amount === null) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-2 py-6">
        <BackLink to={groupUrl} />
        <p className="rounded-xl border border-border/70 border-dashed bg-card/20 p-6 text-center text-muted-foreground text-sm">
          No outstanding debt between {from.name} and {to.name}.
        </p>
      </div>
    )
  }

  const showSwish = isSwishCurrency(group.currency)
  const recipientHasPhone = !!to.swishPhone
  const isMobileSwish = isMobileSwishDevice()
  const swishAmountStr = formatSwishAmount(amount)
  const swishDeepLink =
    swishEnabled && to.swishPhone
      ? buildSwishDeepLink({
          phone: to.swishPhone,
          amount: swishAmountStr,
          message: buildSwishMessage(group.name),
        })
      : ""

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 px-2 py-6">
      <BackLink to={groupUrl} />

      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.14em]">
          Settle up
        </span>
        <h2 className="font-semibold text-[22px] tracking-tight">
          {from.name} → {to.name}
        </h2>
      </div>

      <div className="flex items-center gap-3 overflow-hidden rounded-xl border border-border/70 bg-card/40 p-4">
        <MemberPairAvatars
          from={{ id: from.id, name: from.name }}
          to={{ id: to.id, name: to.name }}
        />

        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate text-[10px] font-medium text-muted-foreground uppercase tracking-[0.14em]">
            {from.name}
            <span className="mx-1 opacity-40">→</span>
            {to.name}
          </span>
          <span className="mt-1 text-[10px] font-medium text-muted-foreground uppercase tracking-[0.14em]">
            Amount due
          </span>
        </div>

        <CurrencyAmount currency={group.currency} amount={amount} />

        <span className="sr-only">
          {from.name} owes {to.name} {formatAmount(group.currency, amount)}
        </span>
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleCopyAmount}
        className="w-full gap-1.5"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
        {copied ? "Copied" : `Copy amount (${swishAmountStr})`}
      </Button>

      {showSwish && (
        <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/40 p-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.14em]">
              Swish
            </span>
            <h3 className="font-semibold text-sm">Pay {to.name}</h3>
          </div>

          {recipientHasPhone ? (
            <>
              {isMobileSwish && (
                <a
                  href={swishDeepLink}
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "w-full gap-1.5",
                  )}
                >
                  <Smartphone className="h-4 w-4" />
                  Pay with Swish
                </a>
              )}

              {!isMobileSwish && qrDataUrl && (
                <div className="flex flex-col items-center gap-1.5 pt-1">
                  <img
                    src={qrDataUrl}
                    alt="Swish QR code"
                    className="h-44 w-44 rounded-md bg-white p-2"
                  />
                  <span className="text-[10px] text-muted-foreground uppercase tracking-[0.14em]">
                    Scan in the Swish app
                  </span>
                </div>
              )}
            </>
          ) : (
            <p className="text-muted-foreground text-xs">
              {to.name} hasn't added a Swish number yet.
            </p>
          )}
        </div>
      )}

      <Button
        type="button"
        onClick={handleMarkSettled}
        disabled={submitting}
        variant={showSwish ? "outline" : "default"}
        className="w-full"
      >
        <Check className="h-4 w-4" />
        Mark settled
      </Button>
      {submitError && (
        <p role="alert" className="text-center text-destructive text-sm">
          {submitError}
        </p>
      )}
    </div>
  )
}
