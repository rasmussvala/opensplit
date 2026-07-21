import { Link } from "react-router-dom"
import MemberAvatar from "@/components/group/MemberAvatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { DbGroup, DbGroupMember } from "@/lib/types"
import { formatAmount } from "@/lib/utils"

interface GroupCardProps {
  group: DbGroup
  /** Omit when the count is unavailable (e.g. the admin all-groups list). */
  memberCount?: number
  /** A small member preview for the home-page group summary. */
  members?: Pick<DbGroupMember, "id" | "guest_name">[]
  /** Omit when the total is unavailable (e.g. the admin all-groups list). */
  totalSpent?: number
}

const MAX_VISIBLE_MEMBERS = 10

export default function GroupCard({
  group,
  memberCount,
  members,
  totalSpent,
}: GroupCardProps) {
  const visibleMembers = members?.slice(0, MAX_VISIBLE_MEMBERS) ?? []
  const hiddenMemberCount = Math.max(
    (members?.length ?? 0) - visibleMembers.length,
    0,
  )
  const hasSummary = totalSpent !== undefined
  const amountText = hasSummary ? formatAmount(group.currency, totalSpent) : ""
  const [currencyCode, ...amountParts] = amountText.split(" ")
  const amountNumber = amountParts.join(" ")
  const memberLabel =
    memberCount === undefined
      ? ""
      : `${memberCount} ${memberCount === 1 ? "member" : "members"}`
  const ariaLabel = hasSummary
    ? `${group.name}, ${amountText} spent, ${memberLabel}`
    : group.name

  return (
    <Link
      to={`/groups/${group.invite_token}`}
      aria-label={ariaLabel}
      className="group block rounded-4xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Card
        size="sm"
        className="py-2 transition-[background-color,box-shadow,transform] duration-200 group-hover:bg-accent/40 group-hover:shadow-lg group-active:scale-[0.99]"
      >
        <CardHeader className="gap-2">
          <CardTitle className="truncate font-sans text-base font-medium text-foreground">
            {group.name}
          </CardTitle>
          {hasSummary && (
            <CardAction>
              <span
                aria-hidden="true"
                className="flex shrink-0 items-baseline gap-1 font-semibold text-[15px] text-foreground tabular-nums"
              >
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  {currencyCode}
                </span>
                <span>{amountNumber}</span>
              </span>
            </CardAction>
          )}
          <CardDescription className="col-span-2 flex min-h-5 items-center justify-between gap-3">
            {hasSummary ? (
              <div aria-hidden="true" className="flex items-center -space-x-1">
                {visibleMembers.map((member) => (
                  <MemberAvatar
                    key={member.id}
                    id={member.id}
                    name={member.guest_name}
                    className="h-5 w-5 text-[9px] shadow-sm ring-2 ring-card"
                  />
                ))}
                {hiddenMemberCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[9px] font-semibold text-muted-foreground ring-2 ring-card tabular-nums">
                    +{hiddenMemberCount}
                  </span>
                )}
              </div>
            ) : (
              <Badge variant="secondary">{group.currency}</Badge>
            )}
            {memberCount !== undefined && (
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.14em]">
                {memberLabel}
              </span>
            )}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  )
}
