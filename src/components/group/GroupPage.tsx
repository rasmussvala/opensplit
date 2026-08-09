import { Plus } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Link, useParams, useSearchParams } from "react-router-dom"
import {
  type Expense,
  type Group,
  loadGroupSnapshot,
  type Member,
  type Settlement,
} from "@/application/groups/loadGroupSnapshot"
import type { SettlementSuggestion } from "@/application/settlements/manageSettlements"
import { manageSettlements } from "@/application/settlements/manageSettlements"
import { useAuth } from "@/components/auth/AuthProvider"
import BalanceSummary from "@/components/balance/BalanceSummary"
import ExpenseList from "@/components/expense/ExpenseList"
import GroupHeader from "@/components/group/GroupHeader"
import JoinGroup from "@/components/group/JoinGroup"
import SwishProfile from "@/components/group/SwishProfile"
import PaymentsList from "@/components/payments/PaymentsList"
import BackLink from "@/components/ui/back-link"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/ui/loading-state"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SupabaseGroupDataSource } from "@/infrastructure/supabase/supabaseGroupDataSource"
import { SupabaseSettlementDataSource } from "@/infrastructure/supabase/supabaseSettlementDataSource"
import { supabase } from "@/lib/supabase"
import { isSwishCurrency } from "@/lib/swish"

type TabValue = "expenses" | "balances" | "payments"

function parseTab(value: string | null): TabValue {
  if (value === "balances" || value === "payments") return value
  return "expenses"
}

type PageState =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "error" }
  | { status: "join"; group: Group }
  | {
      status: "member"
      group: Group
      currentMember: Member
      members: Member[]
      expenses: Expense[]
      settlements: Settlement[]
      suggestions: SettlementSuggestion[]
    }

const groupLoader = loadGroupSnapshot(new SupabaseGroupDataSource())
const settlementManager = manageSettlements(new SupabaseSettlementDataSource())

export default function GroupPage() {
  const { inviteToken } = useParams<{ inviteToken: string }>()
  const { userId } = useAuth()
  const [state, setState] = useState<PageState>({ status: "loading" })
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = parseTab(searchParams.get("tab"))

  function handleTabChange(next: string) {
    const validated = parseTab(next)
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        if (validated === "expenses") params.delete("tab")
        else params.set("tab", validated)
        return params
      },
      { replace: true },
    )
  }

  const loadGroup = useCallback(async () => {
    try {
      const result = await groupLoader.execute({
        inviteToken: inviteToken as string,
        userId,
      })

      if (result.status === "not-found") {
        setState({ status: "not-found" })
      } else if (result.status === "join-required") {
        setState({ status: "join", group: result.group })
      } else {
        setState({
          status: "member",
          ...result.snapshot,
          suggestions: await settlementManager.suggest(result.snapshot),
        })
      }
    } catch {
      setState({ status: "error" })
    }
  }, [inviteToken, userId])

  useEffect(() => {
    void loadGroup()
  }, [loadGroup])

  const groupId = state.status === "member" ? state.group.id : null

  useEffect(() => {
    if (!groupId) return

    let timeout: ReturnType<typeof setTimeout>

    // No group_id filter: Supabase Realtime cannot filter DELETE events,
    // so we listen to all changes and rely on loadGroup's queries to scope data.
    const refetch = () => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        void loadGroup()
      }, 300)
    }

    const channel = supabase
      .channel(`group-${groupId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses" },
        refetch,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "settlements" },
        refetch,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "group_members" },
        refetch,
      )
      .subscribe()

    return () => {
      clearTimeout(timeout)
      void supabase.removeChannel(channel)
    }
  }, [groupId, loadGroup])

  if (state.status === "loading") {
    return <LoadingState centered />
  }

  if (state.status === "not-found") {
    return <p className="p-6 text-center">Group not found</p>
  }

  if (state.status === "error") {
    return (
      <p className="p-6 text-center">Unable to load group. Please try again.</p>
    )
  }

  if (state.status === "join") {
    return (
      <JoinGroup
        groupId={state.group.id}
        groupName={state.group.name}
        currency={state.group.currency}
        onJoined={loadGroup}
      />
    )
  }

  const { group, currentMember, members, expenses, settlements, suggestions } =
    state

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)
  const showSwishProfile = isSwishCurrency(group.currency)

  return (
    <Tabs
      value={tab}
      onValueChange={handleTabChange}
      className="mx-auto flex w-full max-w-sm flex-col gap-4 p-2"
    >
      <BackLink to="/" />
      <GroupHeader group={group} members={members} totalSpent={totalSpent}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="balances">Balances</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>
      </GroupHeader>

      {showSwishProfile && currentMember && (
        <SwishProfile
          memberId={currentMember.id}
          currentPhone={currentMember.swishPhone}
          onUpdated={loadGroup}
        />
      )}

      <TabsContent value="expenses">
        <ExpenseList
          expenses={expenses}
          members={members}
          currency={group.currency}
          inviteToken={inviteToken as string}
        />
      </TabsContent>

      <TabsContent value="balances">
        <BalanceSummary
          expenses={expenses}
          suggestions={suggestions}
          settlements={settlements}
          members={members}
          currency={group.currency}
          inviteToken={inviteToken as string}
          currentMemberId={currentMember?.id ?? null}
        />
      </TabsContent>

      <TabsContent value="payments">
        <PaymentsList
          settlements={settlements}
          members={members}
          currency={group.currency}
          inviteToken={inviteToken as string}
        />
      </TabsContent>

      <Button
        asChild
        size="icon"
        className="fixed right-6 bottom-6 h-14 w-14 rounded-full shadow-lg"
      >
        <Link to={`/groups/${inviteToken}/add-expense`}>
          <Plus className="h-6 w-6" />
          <span className="sr-only">Add expense</span>
        </Link>
      </Button>
    </Tabs>
  )
}
