import { ArrowLeft } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useAuth } from "@/components/auth/AuthProvider"
import AddExpense from "@/components/expense/AddExpense"
import { supabase } from "@/lib/supabase"
import type { DbGroup, DbGroupMember } from "@/lib/types"

type PageState =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "ready"; group: DbGroup; members: DbGroupMember[] }

export default function AddExpensePage() {
  const { inviteToken } = useParams<{ inviteToken: string }>()
  const { userId } = useAuth()
  const navigate = useNavigate()
  const [state, setState] = useState<PageState>({ status: "loading" })

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

    const { data: members } = await supabase
      .from("group_members")
      .select()
      .eq("group_id", group.id)

    setState({ status: "ready", group, members: members ?? [] })
  }, [inviteToken, userId])

  useEffect(() => {
    load()
  }, [load])

  if (state.status === "loading") {
    return <p className="p-6 text-center">Loading...</p>
  }

  if (state.status === "not-found") {
    return <p className="p-6 text-center">Group not found</p>
  }

  const { group, members } = state
  const groupUrl = `/groups/${inviteToken}`

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-5 p-6">
      <Link
        to={groupUrl}
        className="group inline-flex w-fit items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.14em] transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        Back
      </Link>

      <h2 className="font-semibold text-[22px] tracking-tight">New expense</h2>

      <AddExpense
        groupId={group.id}
        members={members}
        currency={group.currency}
        onAdded={() => navigate(groupUrl)}
      />
    </div>
  )
}
