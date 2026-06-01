import { Settings } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

export default function HomePage() {
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
    </div>
  )
}
