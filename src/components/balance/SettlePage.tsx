import { ArrowLeft, ArrowRight, Check, Copy, Smartphone } from "lucide-react"
import QRCode from "qrcode"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useAuth } from "@/components/auth/AuthProvider"
import MemberAvatar from "@/components/group/MemberAvatar"
import { Button, buttonVariants } from "@/components/ui/button"
import { LoadingState } from "@/components/ui/loading-state"
import { calculateBalances } from "@/lib/balances"
import { simplifyDebts } from "@/lib/simplify"
import { supabase } from "@/lib/supabase"
import {
  buildSwishDeepLink,
  buildSwishQrPayload,
  formatSwishAmount,
  isMobileSwishDevice,
} from "@/lib/swish"
import type {
  DbExpense,
  DbGroup,
  DbGroupMember,
  DbSettlement,
} from "@/lib/types"
import { cn, formatAmount } from "@/lib/utils"

type PageState =
  | { status: "loading" }
  | { status: "not-found" }
  | {
      status: "ready"
      group: DbGroup
      members: DbGroupMember[]
      from: DbGroupMember
      to: DbGroupMember
      amount: number | null
    }

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
  const [copied, setCopied] = useState(false)

  const groupUrl = `/groups/${inviteToken}?tab=balances`

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

    const [{ data: members }, { data: expenses }, { data: settlements }] =
      await Promise.all([
        supabase.from("group_members").select().eq("group_id", group.id),
        supabase.from("expenses").select().eq("group_id", group.id),
        supabase.from("settlements").select().eq("group_id", group.id),
      ])

    const memberRows = (members ?? []) as DbGroupMember[]
    const from = memberRows.find((m) => m.id === fromMemberId)
    const to = memberRows.find((m) => m.id === toMemberId)

    if (!from || !to) {
      setState({ status: "not-found" })
      return
    }

    const mappedExpenses = (expenses ?? []).map((e: DbExpense) => ({
      paid_by: e.paid_by,
      amount: Number(e.amount),
      split_among: e.split_among,
      split_overrides: e.split_overrides,
    }))
    const mappedSettlements = (settlements ?? []).map((s: DbSettlement) => ({
      from: s.from_member,
      to: s.to_member,
      amount: Number(s.amount),
    }))
    const balances = calculateBalances(mappedExpenses, mappedSettlements)
    const transactions = simplifyDebts(balances)
    const match = transactions.find(
      (t) => t.from === fromMemberId && t.to === toMemberId,
    )

    setState({
      status: "ready",
      group: group as DbGroup,
      members: memberRows,
      from,
      to,
      amount: match ? match.amount : null,
    })
  }, [inviteToken, fromMemberId, toMemberId, userId])

  useEffect(() => {
    load()
  }, [load])

  const ready =
    state.status === "ready" && state.amount !== null
      ? {
          group: state.group,
          to: state.to,
          amount: state.amount,
        }
      : null

  const swishEnabled =
    !!ready &&
    ready.group.currency === "SEK" &&
    !!ready.to.swish_phone &&
    ready.to.swish_phone.length > 0

  const swishPhone = ready?.to.swish_phone ?? null
  const swishAmountStr = ready ? formatSwishAmount(ready.amount) : ""
  const swishMessage = ready
    ? `Opensplit: ${ready.group.name}`.slice(0, 50)
    : ""

  const swishDeepLink = useMemo(() => {
    if (!swishEnabled || !swishPhone) return ""
    return buildSwishDeepLink({
      phone: swishPhone,
      amount: swishAmountStr,
      message: swishMessage,
    })
  }, [swishEnabled, swishPhone, swishAmountStr, swishMessage])

  const swishQrPayload = useMemo(() => {
    if (!swishEnabled || !swishPhone) return ""
    return buildSwishQrPayload({
      phone: swishPhone,
      amount: swishAmountStr,
      message: swishMessage,
    })
  }, [swishEnabled, swishPhone, swishAmountStr, swishMessage])

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!swishQrPayload) {
      setQrDataUrl(null)
      return
    }
    let cancelled = false
    QRCode.toDataURL(swishQrPayload, { margin: 1, width: 220 })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url)
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null)
      })
    return () => {
      cancelled = true
    }
  }, [swishQrPayload])

  async function handleCopyAmount() {
    if (state.status !== "ready" || state.amount === null) return
    const text = formatSwishAmount(state.amount)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard unavailable; ignore
    }
  }

  async function handleMarkSettled() {
    if (state.status !== "ready" || state.amount === null) return
    setSubmitting(true)
    try {
      const { error } = await supabase.from("settlements").insert({
        group_id: state.group.id,
        from_member: state.from.id,
        to_member: state.to.id,
        amount: state.amount,
      })
      if (error) return
      navigate(`/groups/${inviteToken}?tab=payments`)
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
        <Link
          to={groupUrl}
          className="group inline-flex w-fit items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.14em] transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
          Back
        </Link>
        <p className="rounded-xl border border-border/70 border-dashed bg-card/20 p-6 text-center text-muted-foreground text-sm">
          No outstanding debt between {from.guest_name} and {to.guest_name}.
        </p>
      </div>
    )
  }

  const amountText = formatAmount(group.currency, amount)
  const [currencyCode, ...amountParts] = amountText.split(" ")
  const amountNumber = amountParts.join(" ")
  const showSwish = group.currency === "SEK"
  const recipientHasPhone = !!to.swish_phone && to.swish_phone.length > 0
  const showSwishButton = isMobileSwishDevice()

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
          Settle up
        </span>
        <h2 className="font-semibold text-[22px] tracking-tight">
          {from.guest_name} → {to.guest_name}
        </h2>
      </div>

      <div className="flex items-center gap-3 overflow-hidden rounded-xl border border-border/70 bg-card/40 p-4">
        <div aria-hidden="true" className="flex shrink-0 items-center">
          <MemberAvatar
            id={from.id}
            name={from.guest_name}
            className="h-9 w-9 shadow-sm ring-2 ring-background"
          />
          <div className="relative z-1 -mx-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-background text-muted-foreground ring-1 ring-border">
            <ArrowRight className="h-3 w-3" />
          </div>
          <MemberAvatar
            id={to.id}
            name={to.guest_name}
            className="h-9 w-9 shadow-sm ring-2 ring-background"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="truncate text-[10px] font-medium text-muted-foreground uppercase tracking-[0.14em]">
            {from.guest_name}
            <span className="mx-1 opacity-40">→</span>
            {to.guest_name}
          </span>
          <span className="mt-1 text-[10px] font-medium text-muted-foreground uppercase tracking-[0.14em]">
            Amount due
          </span>
        </div>

        <span className="flex shrink-0 items-baseline gap-1 font-semibold text-[15px] text-foreground tabular-nums">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            {currencyCode}
          </span>
          <span>{amountNumber}</span>
        </span>

        <span className="sr-only">
          {from.guest_name} owes {to.guest_name} {amountText}
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
        {copied ? "Copied" : `Copy amount (${formatSwishAmount(amount)})`}
      </Button>

      {showSwish && (
        <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/40 p-4">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.14em]">
              Swish
            </span>
            <h3 className="font-semibold text-sm">Pay {to.guest_name}</h3>
          </div>

          {recipientHasPhone ? (
            <>
              {showSwishButton && (
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

              {qrDataUrl && (
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
              {to.guest_name} hasn't added a Swish number yet.
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
    </div>
  )
}
