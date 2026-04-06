import { useState } from "react"
import { Button } from "@/components/ui/button"

interface InviteLinkProps {
  inviteToken: string
}

export default function InviteLink({ inviteToken }: InviteLinkProps) {
  const [copied, setCopied] = useState(false)

  const url = `${window.location.origin}${import.meta.env.BASE_URL}groups/${inviteToken}`

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex gap-2 items-center">
      <input
        type="text"
        readOnly
        value={url}
        className="flex-1 rounded border bg-muted px-3 py-2 text-sm"
      />
      <Button variant="outline" size="sm" onClick={handleCopy}>
        {copied ? "Copied!" : "Copy"}
      </Button>
    </div>
  )
}
