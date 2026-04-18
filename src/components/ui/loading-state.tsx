import { LoaderCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingStateProps {
  label?: string
  className?: string
  centered?: boolean
}

export function LoadingState({
  label = "Loading...",
  className,
  centered = false,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center justify-center gap-2 bg-background p-6 text-center text-muted-foreground",
        centered && "min-h-[70svh]",
        className,
      )}
    >
      <LoaderCircle
        aria-hidden="true"
        className="h-4 w-4 animate-spin text-foreground/70"
      />
      <span>{label}</span>
    </div>
  )
}
