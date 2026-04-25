import { ArrowRight } from "lucide-react"
import MemberAvatar from "@/components/group/MemberAvatar"
import { cn } from "@/lib/utils"

interface MemberPairAvatarsProps {
  from: { id: string; name: string }
  to: { id: string; name: string }
  hoverNudge?: boolean
}

export default function MemberPairAvatars({
  from,
  to,
  hoverNudge = false,
}: MemberPairAvatarsProps) {
  return (
    <div aria-hidden="true" className="flex shrink-0 items-center">
      <MemberAvatar
        id={from.id}
        name={from.name}
        className="h-9 w-9 shadow-sm ring-2 ring-background"
      />
      <div
        className={cn(
          "relative z-1 -mx-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-background text-muted-foreground ring-1 ring-border",
          hoverNudge &&
            "transition-transform duration-200 group-hover:translate-x-0.5",
        )}
      >
        <ArrowRight className="h-3 w-3" />
      </div>
      <MemberAvatar
        id={to.id}
        name={to.name}
        className="h-9 w-9 shadow-sm ring-2 ring-background"
      />
    </div>
  )
}
