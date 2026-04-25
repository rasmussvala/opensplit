import { ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"

interface BackLinkProps {
  to: string
  children?: React.ReactNode
}

export default function BackLink({ to, children = "Back" }: BackLinkProps) {
  return (
    <Link
      to={to}
      className="group inline-flex w-fit items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase tracking-[0.14em] transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
      {children}
    </Link>
  )
}
