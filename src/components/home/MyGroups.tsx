import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import GroupCard from "@/components/group/GroupCard"
import { LoadingState } from "@/components/ui/loading-state"
import { supabase } from "@/lib/supabase"
import type { DbGroup } from "@/lib/types"

type GroupWithCount = DbGroup & {
  members: [{ count: number }]
}

export default function MyGroups() {
  const { userId } = useAuth()
  const [groups, setGroups] = useState<GroupWithCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchGroups() {
      const { data, error } = await supabase
        .from("group_members")
        .select("group:groups(*, members:group_members(count))")
        .eq("user_id", userId)

      if (!error && data) {
        const joined = (data as unknown as { group: GroupWithCount | null }[])
          .map((row) => row.group)
          .filter((group): group is GroupWithCount => group !== null)
        setGroups(joined)
      }
      setLoading(false)
    }
    fetchGroups()
  }, [userId])

  if (loading) return <LoadingState className="px-0" />

  if (groups.length === 0)
    return (
      <p className="text-muted-foreground">You haven't joined any groups yet</p>
    )

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => (
        <GroupCard
          key={group.id}
          group={group}
          memberCount={group.members[0]?.count ?? 0}
        />
      ))}
    </div>
  )
}
