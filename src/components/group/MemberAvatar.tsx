import { cn } from "@/lib/utils"

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
