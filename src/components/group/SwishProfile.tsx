import { Pencil } from "lucide-react"
import { useState } from "react"
import { application } from "@/application/composition"
import SwishPhoneInput from "@/components/group/SwishPhoneInput"
import { Button } from "@/components/ui/button"

interface SwishProfileProps {
  memberId: string
  currentPhone: string | null
  onUpdated: () => void
}

export default function SwishProfile({
  memberId,
  currentPhone,
  onUpdated,
}: SwishProfileProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(currentPhone ?? "")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function handleStartEdit() {
    setValue(currentPhone ?? "")
    setError(null)
    setEditing(true)
  }

  function handleCancel() {
    setEditing(false)
    setError(null)
  }

  async function handleSave() {
    setError(null)
    setSaving(true)
    try {
      // A blank field is how this screen says the number should go; the
      // membership module validates whatever else is typed into it.
      const result = await application.membership.saveSwishPhone({
        memberId,
        phone: value.trim() ? value : null,
      })
      if (result.status === "invalid-phone") {
        setError(result.message)
        return
      }
      if (result.status === "member-not-found") return
      setEditing(false)
      onUpdated()
    } finally {
      setSaving(false)
    }
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-xl border border-border/70 bg-card/40 px-3 py-2 text-sm">
        <div className="flex flex-col leading-tight">
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.14em]">
            Your Swish
          </span>
          <span className="font-medium tabular-nums">
            {currentPhone ?? (
              <span className="text-muted-foreground">Not set</span>
            )}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleStartEdit}
          aria-label="Edit Swish phone"
          className="gap-1.5"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-card/40 p-3">
      <SwishPhoneInput
        id="swish-profile-input"
        label="Your Swish phone"
        value={value}
        onChange={(next) => {
          setValue(next)
          if (error) setError(null)
        }}
        error={error}
        helperText="Leave blank to remove your number."
      />
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          disabled={saving}
        >
          Cancel
        </Button>
        <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
          Save
        </Button>
      </div>
    </div>
  )
}
