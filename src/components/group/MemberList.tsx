import { ChevronDown } from "lucide-react"
import { useState } from "react"
import type { DbGroupMember } from "@/lib/types"

interface MemberListProps {
  members: DbGroupMember[]
}

export default function MemberList({ members }: MemberListProps) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between"
      >
        <h2 className="text-lg font-semibold">Members ({members.length})</h2>
        <ChevronDown
          className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <ul className="mt-1 space-y-1">
          {members.map((m) => (
            <li key={m.id} className="text-sm">
              {m.guest_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
