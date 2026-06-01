import { Button } from "@/components/ui/button"

interface AddToHomeScreenProps {
  onContinueInBrowser: () => void
}

// Placeholder — the full design-forward guide (iOS/Android steps) lands in a
// later step. For now it explains the intent and offers a browser escape.
export default function AddToHomeScreen({
  onContinueInBrowser,
}: AddToHomeScreenProps) {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-4 px-2 py-10 text-center">
      <h1 className="text-2xl font-bold">Add opensplit to your home screen</h1>
      <p className="text-muted-foreground">
        Install the app for the best experience. A step-by-step guide is coming
        soon.
      </p>
      <Button variant="outline" onClick={onContinueInBrowser}>
        Continue in browser
      </Button>
    </div>
  )
}
