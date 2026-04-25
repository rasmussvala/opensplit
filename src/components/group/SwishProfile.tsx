import { Pencil } from "lucide-react"
import { useState } from "react"
import SwishPhoneInput from "@/components/group/SwishPhoneInput"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { normalizeSwishPhone, SWISH_PHONE_ERROR } from "@/lib/swish"

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
    let normalized: string | null = null
    if (value.trim()) {
      normalized = normalizeSwishPhone(value)
      if (!normalized) {
        setError(SWISH_PHONE_ERROR)
        return
      }
    }
    setError(null)
    setSaving(true)
    try {
      const { error: updateError } = await supabase
        .from("group_members")
        .update({ swish_phone: normalized })
        .eq("id", memberId)
      if (updateError) return
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
