import { useCallback, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { useAuth } from "@/components/AuthProvider"
import JoinGroup from "@/components/JoinGroup"
import { supabase } from "@/lib/supabase"
import type { DbGroup, DbGroupMember } from "@/lib/types"

type PageState =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "join"; group: DbGroup }
  | { status: "member"; group: DbGroup; members: DbGroupMember[] }

export default function GroupPage() {
  const { inviteToken } = useParams<{ inviteToken: string }>()
  const { userId } = useAuth()
  const [state, setState] = useState<PageState>({ status: "loading" })

  const loadGroup = useCallback(async () => {
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
      setState({ status: "join", group })
      return
    }

    const { data: members } = await supabase
      .from("group_members")
      .select()
      .eq("group_id", group.id)

    setState({ status: "member", group, members: members ?? [] })
  }, [inviteToken, userId])

  useEffect(() => {
    loadGroup()
  }, [loadGroup])

  if (state.status === "loading") {
    return <p className="p-6 text-center">Loading…</p>
  }

  if (state.status === "not-found") {
    return <p className="p-6 text-center">Group not found</p>
  }

  if (state.status === "join") {
    return (
      <JoinGroup
        groupId={state.group.id}
        groupName={state.group.name}
        onJoined={loadGroup}
      />
    )
  }

  const { group, members } = state

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">{group.name}</h1>
      <p className="text-sm text-muted-foreground">{group.currency}</p>

      <div>
        <h2 className="text-lg font-semibold">Members</h2>
        <ul className="mt-1 space-y-1">
          {members.map((m) => (
            <li key={m.id} className="text-sm">
              {m.guest_name}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
