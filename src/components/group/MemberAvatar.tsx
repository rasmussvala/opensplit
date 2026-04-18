import { cn } from "@/lib/utils"

const AVATAR_COLORS = [
  "bg-avatar-01",
  "bg-avatar-02",
  "bg-avatar-03",
  "bg-avatar-04",
  "bg-avatar-05",
  "bg-avatar-06",
  "bg-avatar-07",
  "bg-avatar-08",
  "bg-avatar-09",
  "bg-avatar-10",
]

function colorFor(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function initialOf(name: string): string {
  return name.charAt(0).toUpperCase() || "?"
}

interface MemberAvatarProps {
  id: string
  name: string
  className?: string
}

export default function MemberAvatar({
  id,
  name,
  className,
}: MemberAvatarProps) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-semibold text-white text-xs",
        colorFor(id),
        className,
      )}
    >
      {initialOf(name)}
    </div>
  )
}
