import { useEffect, useState } from "react"
import GroupCard from "@/components/group/GroupCard"
import { LoadingState } from "@/components/ui/loading-state"
import { supabase } from "@/lib/supabase"
import type { DbGroup } from "@/lib/types"

export default function GroupList() {
  const [groups, setGroups] = useState<DbGroup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchGroups() {
      const { data, error } = await supabase
        .from("groups")
        .select("*")
        .order("created_at", { ascending: false })

      if (!error && data) {
        setGroups(data as DbGroup[])
      }
      setLoading(false)
    }
    fetchGroups()
  }, [])

  if (loading) return <LoadingState className="px-0" />

  if (groups.length === 0)
    return <p className="text-muted-foreground">No groups yet</p>

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => (
        <GroupCard key={group.id} group={group} />
      ))}
    </div>
  )
}
