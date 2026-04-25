import { Pencil } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { normalizeSwishPhone } from "@/lib/swish"

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
        setError("Enter a valid Swedish mobile number")
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
      <label htmlFor="swish-profile-input" className="flex flex-col gap-1">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-[0.14em]">
          Your Swish phone
        </span>
        <input
          id="swish-profile-input"
          type="tel"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            if (error) setError(null)
          }}
          placeholder="070 123 45 67"
          className="rounded border px-3 py-2 text-base md:text-sm"
          aria-invalid={error ? "true" : undefined}
        />
      </label>
      {error && <span className="text-destructive text-xs">{error}</span>}
      <span className="text-muted-foreground text-xs">
        Leave blank to remove your number.
      </span>
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
