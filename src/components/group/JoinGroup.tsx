import { useState } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import SwishPhoneInput from "@/components/group/SwishPhoneInput"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import {
  isSwishCurrency,
  normalizeSwishPhone,
  SWISH_PHONE_ERROR,
} from "@/lib/swish"

interface JoinGroupProps {
  groupId: string
  groupName: string
  currency: string
  onJoined: () => void
}

export default function JoinGroup({
  groupId,
  groupName,
  currency,
  onJoined,
}: JoinGroupProps) {
  const { userId } = useAuth()
  const [name, setName] = useState("")
  const [swishPhone, setSwishPhone] = useState("")
  const [phoneError, setPhoneError] = useState<string | null>(null)

  const showSwish = isSwishCurrency(currency)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    let normalizedPhone: string | null = null
    if (showSwish && swishPhone.trim()) {
      normalizedPhone = normalizeSwishPhone(swishPhone)
      if (!normalizedPhone) {
        setPhoneError(SWISH_PHONE_ERROR)
        return
      }
    }

    setPhoneError(null)

    const { error } = await supabase.from("group_members").insert({
      group_id: groupId,
      guest_name: name.trim(),
      user_id: userId,
      ...(showSwish ? { swish_phone: normalizedPhone } : {}),
    })

    if (error) return

    onJoined()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex max-w-sm flex-col gap-4 p-6"
    >
      <h1 className="text-2xl font-bold">Join {groupName}</h1>

      <div className="flex flex-col gap-1">
        <label htmlFor="display-name" className="font-medium text-sm">
          Display name
        </label>
        <input
          id="display-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Alice"
          className="rounded border px-3 py-2 text-base md:text-sm"
        />
      </div>

      {showSwish && (
        <SwishPhoneInput
          id="swish-phone"
          label="Swish phone (optional)"
          value={swishPhone}
          onChange={(next) => {
            setSwishPhone(next)
            if (phoneError) setPhoneError(null)
          }}
          error={phoneError}
          helperText="Lets others pay you back via Swish."
        />
      )}

      <Button type="submit">Join group</Button>
    </form>
  )
}
