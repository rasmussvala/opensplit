import { Link2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface InviteLinkProps {
  inviteToken: string
}

export default function InviteLink({ inviteToken }: InviteLinkProps) {
  const [copied, setCopied] = useState(false)

  const url = `${window.location.origin}${import.meta.env.BASE_URL}groups/${inviteToken}`

  async function handleShare() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleShare}>
      <Link2 className="h-4 w-4" data-icon="inline-start" />
      {copied ? "Copied!" : "Share link"}
    </Button>
  )
}
