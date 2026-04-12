import type { DbGroupMember } from "@/lib/types"
import MemberAvatar from "./MemberAvatar"

interface MemberListProps {
  members: DbGroupMember[]
}

export default function MemberList({ members }: MemberListProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
      {members.map((m) => (
        <div key={m.id} className="flex shrink-0 items-center gap-1.5">
          <MemberAvatar id={m.id} name={m.guest_name} />
          <span className="text-sm">{m.guest_name}</span>
        </div>
      ))}
    </div>
  )
}
