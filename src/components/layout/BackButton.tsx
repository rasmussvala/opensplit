import { ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

interface BackButtonProps {
  to?: string
  label?: string
}

export default function BackButton({
  to = "/",
  label = "Back",
}: BackButtonProps) {
  return (
    <Button asChild variant="ghost" size="sm" className="self-start px-2">
      <Link to={to}>
        <ArrowLeft className="h-4 w-4" data-icon="inline-start" />
        {label}
      </Link>
    </Button>
  )
}
