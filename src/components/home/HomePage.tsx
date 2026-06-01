import { Settings } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"
import AddToHomeScreen from "@/components/home/AddToHomeScreen"
import JoinByCode from "@/components/home/JoinByCode"
import MyGroups from "@/components/home/MyGroups"
import { Button } from "@/components/ui/button"
import { isMobileDevice, useStandalone } from "@/lib/useStandalone"

function AppHome() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 px-2 py-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">opensplit</h1>
        <Button asChild variant="ghost" size="icon" aria-label="Admin">
          <Link to="/admin">
            <Settings className="h-4 w-4" />
          </Link>
        </Button>
      </header>

      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">Your groups</h2>
        <MyGroups />
      </div>

      <JoinByCode />
    </div>
  )
}

export default function HomePage() {
  const installed = useStandalone()
  const [continueInBrowser, setContinueInBrowser] = useState(false)

  // Show the install guide only on mobile, when not installed, and the user
  // hasn't chosen to keep using the browser. Desktop always gets the app.
  const showGuide = isMobileDevice() && !installed && !continueInBrowser

  if (showGuide) {
    return (
      <AddToHomeScreen onContinueInBrowser={() => setContinueInBrowser(true)} />
    )
  }

  return <AppHome />
}
