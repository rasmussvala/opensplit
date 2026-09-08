import type { Group, Member } from "@rasmussvala/opensplit-core"
import { formatAmount } from "@rasmussvala/opensplit-core"
import type { ReactNode } from "react"
import InviteCode from "@/components/group/InviteCode"
import MemberList from "@/components/group/MemberList"

interface GroupHeaderProps {
  group: Group
  members: Member[]
  totalSpent: number
  children?: ReactNode
}

export default function GroupHeader({
  group,
  members,
  totalSpent,
  children,
}: GroupHeaderProps) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h1 className="text-2xl font-bold mb-0!">{group.name}</h1>
        <span className="text-sm text-muted-foreground">
          {formatAmount(group.currency, totalSpent)}
        </span>
      </div>
      <MemberList members={members} />
      <InviteCode inviteToken={group.inviteToken} />
      {children}
    </div>
  )
}
