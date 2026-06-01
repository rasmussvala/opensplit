import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { DbGroup } from "@/lib/types"

interface GroupCardProps {
  group: DbGroup
  /** Omit when the count is unavailable (e.g. the admin all-groups list). */
  memberCount?: number
}

export default function GroupCard({ group, memberCount }: GroupCardProps) {
  return (
    <Link to={`/groups/${group.invite_token}`}>
      <Card size="sm">
        <CardHeader>
          <CardTitle>{group.name}</CardTitle>
          <CardDescription className="flex items-center gap-2">
            <Badge variant="secondary">{group.currency}</Badge>
            {memberCount !== undefined && (
              <span>
                {memberCount} {memberCount === 1 ? "member" : "members"}
              </span>
            )}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}
