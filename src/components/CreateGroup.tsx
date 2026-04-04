import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

const CURRENCIES = ["USD", "EUR", "GBP", "NOK", "SEK"]

export default function CreateGroup() {
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [members, setMembers] = useState(["", ""])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return

    const { data: group, error: groupError } = await supabase
      .from("groups")
      .insert({ name: name.trim(), currency })
      .select()
      .single()

    if (groupError || !group) return

    const validMembers = members.map((m) => m.trim()).filter(Boolean)
    if (validMembers.length > 0) {
      await supabase.from("group_members").insert(
        validMembers.map((guest_name) => ({
          group_id: group.id,
          guest_name,
        })),
      )
    }

    navigate(`/groups/${group.invite_token}`)
  }

  function updateMember(index: number, value: string) {
    setMembers((prev) => prev.map((m, i) => (i === index ? value : m)))
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

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Members</span>
        {members.map((member, i) => (
          <input
            // biome-ignore lint/suspicious/noArrayIndexKey: order is stable
            key={i}
            type="text"
            value={member}
            onChange={(e) => updateMember(i, e.target.value)}
            placeholder="Member name"
            className="rounded border px-3 py-2 text-sm"
          />
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => setMembers((prev) => [...prev, ""])}
        >
          Add member
        </Button>
      </div>

      <Button type="submit">Create group</Button>
    </form>
  )
}
