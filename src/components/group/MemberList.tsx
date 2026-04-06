import type { DbGroupMember } from "@/lib/types"

interface MemberListProps {
  members: DbGroupMember[]
}

export default function MemberList({ members }: MemberListProps) {
  return (
    <div>
      <h2 className="text-lg font-semibold">Members ({members.length})</h2>
      <ul className="mt-1 space-y-1">
        {members.map((m) => (
          <li key={m.id} className="text-sm">
            {m.guest_name}
          </li>
        ))}
      </ul>
    </div>
  )
}
