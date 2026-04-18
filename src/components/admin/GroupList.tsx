import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LoadingState } from "@/components/ui/loading-state"
import { supabase } from "@/lib/supabase"
import type { DbGroup } from "@/lib/types"

type GroupWithCount = DbGroup & {
  group_members: [{ count: number }]
}

export default function GroupList() {
  const [groups, setGroups] = useState<GroupWithCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchGroups() {
      const { data, error } = await supabase
        .from("groups")
        .select("*, group_members(count)")
        .order("created_at", { ascending: false })

      if (!error && data) {
        setGroups(data as GroupWithCount[])
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
      {groups.map((group) => {
        const count = group.group_members[0]?.count ?? 0
        return (
          <Link key={group.id} to={`/groups/${group.invite_token}`}>
            <Card size="sm">
              <CardHeader>
                <CardTitle>{group.name}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Badge variant="secondary">{group.currency}</Badge>
                  <span>
                    {count} {count === 1 ? "member" : "members"}
                  </span>
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}
