import {
  Check,
  Download,
  EllipsisVertical,
  type LucideIcon,
  Share,
  SquarePlus,
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { getMobilePlatform } from "@/lib/useStandalone"
import { cn } from "@/lib/utils"

interface AddToHomeScreenProps {
  onContinueInBrowser: () => void
}

type Platform = "ios" | "android"

interface Step {
  icon: LucideIcon
  title: string
  description: string
}

const IOS_STEPS: Step[] = [
  {
    icon: Share,
    title: "Tap the Share button",
    description: "In Safari's bottom toolbar, tap the Share icon.",
  },
  {
    icon: SquarePlus,
    title: "Add to Home Screen",
    description: 'Scroll down the share sheet and choose "Add to Home Screen".',
  },
  {
    icon: Check,
    title: "Tap Add",
    description: "Confirm, and opensplit lands on your home screen.",
  },
]

const ANDROID_STEPS: Step[] = [
  {
    icon: EllipsisVertical,
    title: "Open the menu",
    description: "Tap the three-dot menu in Chrome's top-right corner.",
  },
  {
    icon: Download,
    title: "Install app",
    description: 'Choose "Install app" or "Add to Home screen".',
  },
  {
    icon: Check,
    title: "Confirm",
    description: "opensplit installs to your home screen.",
  },
]

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: "ios", label: "iPhone" },
  { value: "android", label: "Android" },
]

function StepList({ steps }: { steps: Step[] }) {
  return (
    <ol className="flex w-full flex-col gap-3">
      {steps.map((step, index) => (
        <li
          key={step.title}
          className="flex items-start gap-3 rounded-2xl border bg-card p-4 fade-in slide-in-from-bottom-2 fill-mode-backwards animate-in"
          style={{ animationDelay: `${index * 80}ms` }}
        >
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {index + 1}
          </span>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 font-medium">
              <step.icon className="h-4 w-4 text-primary" />
              {step.title}
            </div>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

export default function AddToHomeScreen({
  onContinueInBrowser,
}: AddToHomeScreenProps) {
  const [platform, setPlatform] = useState<Platform>(getMobilePlatform)
  const steps = platform === "android" ? ANDROID_STEPS : IOS_STEPS

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 px-4 py-10">
      <div className="flex flex-col items-center gap-2 text-center fade-in slide-in-from-bottom-2 animate-in">
        <h1 className="font-display text-4xl">Install opensplit</h1>
        <p className="text-muted-foreground">
          Add it to your home screen to use it like a real app — no app store
          needed.
        </p>
      </div>

      <div
        role="tablist"
        className="inline-flex rounded-full bg-muted p-1"
        aria-label="Choose your device"
      >
        {PLATFORMS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={platform === value}
            onClick={() => setPlatform(value)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              platform === value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <StepList steps={steps} />

      <Button variant="ghost" onClick={onContinueInBrowser}>
        Continue in browser
      </Button>
    </div>
  )
}
