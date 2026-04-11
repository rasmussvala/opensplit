import InviteLink from "@/components/group/InviteLink"
import MemberList from "@/components/group/MemberList"
import type { DbGroup, DbGroupMember } from "@/lib/types"
import { formatAmount } from "@/lib/utils"

interface GroupHeaderProps {
  group: DbGroup
  members: DbGroupMember[]
  totalSpent: number
}

export default function GroupHeader({
  group,
  members,
  totalSpent,
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
      <InviteLink inviteToken={group.invite_token} />
    </div>
  )
}
