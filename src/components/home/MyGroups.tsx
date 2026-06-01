import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "@/components/auth/AuthProvider"
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
        const joined = (data as { group: GroupWithCount | null }[])
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
      {groups.map((group) => {
        const count = group.members[0]?.count ?? 0
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
