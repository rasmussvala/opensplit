import { Link2 } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface InviteCodeProps {
  inviteToken: string
}

export default function InviteCode({ inviteToken }: InviteCodeProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteToken)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleCopy}>
      <Link2 className="h-4 w-4" data-icon="inline-start" />
      {copied ? "Copied!" : "Copy code"}
    </Button>
  )
}
