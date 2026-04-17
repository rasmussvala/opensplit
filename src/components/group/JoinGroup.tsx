import { useState } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

interface JoinGroupProps {
  groupId: string
  groupName: string
  onJoined: () => void
}

export default function JoinGroup({
  groupId,
  groupName,
  onJoined,
}: JoinGroupProps) {
  const { userId } = useAuth()
  const [name, setName] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    const { error } = await supabase.from("group_members").insert({
      group_id: groupId,
      guest_name: name.trim(),
      user_id: userId,
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
        <label htmlFor="display-name" className="text-sm font-medium">
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

      <Button type="submit">Join group</Button>
    </form>
  )
}
