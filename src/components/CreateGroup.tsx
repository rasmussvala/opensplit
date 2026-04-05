import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/components/AuthProvider"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

const CURRENCIES = ["USD", "EUR", "GBP", "NOK", "SEK"]

export default function CreateGroup() {
  const navigate = useNavigate()
  const { userId } = useAuth()
  const [name, setName] = useState("")
  const [currency, setCurrency] = useState("USD")

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault()
    if (!name.trim()) return

    const { data: group, error: groupError } = await supabase
      .from("groups")
      .insert({ name: name.trim(), currency, created_by: userId })
      .select()
      .single()

    if (groupError || !group) return

    navigate(`/groups/${group.invite_token}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex max-w-sm flex-col gap-4 p-6"
    >
      <h1 className="text-2xl font-bold">Create a group</h1>

      <div className="flex flex-col gap-1">
        <label htmlFor="group-name" className="text-sm font-medium">
          Group name
        </label>
        <input
          id="group-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Trip to Oslo"
          className="rounded border px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="currency" className="text-sm font-medium">
          Currency
        </label>
        <select
          id="currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="rounded border px-3 py-2 text-sm"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <Button type="submit">Create group</Button>
    </form>
  )
}
