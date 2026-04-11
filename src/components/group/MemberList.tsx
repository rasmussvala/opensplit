import type { DbGroupMember } from "@/lib/types"

interface MemberListProps {
  members: DbGroupMember[]
}

const AVATAR_COLORS = [
  "bg-rose-400 dark:bg-rose-500",
  "bg-amber-400 dark:bg-amber-500",
  "bg-emerald-400 dark:bg-emerald-500",
  "bg-sky-400 dark:bg-sky-500",
  "bg-violet-400 dark:bg-violet-500",
  "bg-pink-400 dark:bg-pink-500",
  "bg-teal-400 dark:bg-teal-500",
  "bg-orange-400 dark:bg-orange-500",
  "bg-indigo-400 dark:bg-indigo-500",
  "bg-lime-400 dark:bg-lime-500",
]

function hashIndex(id: string, length: number): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0
  }
  return Math.abs(hash) % length
}

export default function MemberList({ members }: MemberListProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto">
      {members.map((m) => {
        const colorClass = AVATAR_COLORS[hashIndex(m.id, AVATAR_COLORS.length)]
        const initial = m.guest_name.charAt(0).toUpperCase()
        return (
          <div key={m.id} className="flex shrink-0 items-center gap-1.5">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${colorClass}`}
            >
              {initial}
            </div>
            <span className="text-sm">{m.guest_name}</span>
          </div>
        )
      })}
    </div>
  )
}
