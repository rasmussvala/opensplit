import { ArrowLeft } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { useAuth } from "@/components/auth/AuthProvider"
import AddExpense from "@/components/expense/AddExpense"
import { Button } from "@/components/ui/button"
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

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-4 p-6">
      <Button asChild variant="ghost" size="sm" className="w-fit p-0">
        <Link to={`/groups/${inviteToken}`}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
      </Button>
      <AddExpense
        groupId={group.id}
        members={members}
        onAdded={() => navigate(`/groups/${inviteToken}`)}
      />
    </div>
  )
}
