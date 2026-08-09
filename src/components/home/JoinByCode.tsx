import type { SubmitEvent } from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"

export default function JoinByCode() {
  const navigate = useNavigate()
  const [code, setCode] = useState("")

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) return
    navigate(`/groups/${trimmed}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <h2 className="text-xl font-bold">Join a group</h2>
      <div className="flex flex-col gap-1">
        <label htmlFor="group-code" className="text-sm font-medium">
          Group code
        </label>
        <input
          id="group-code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste your invite code"
          className="rounded border px-3 py-2 text-base md:text-sm"
        />
      </div>
      <Button type="submit">Join group</Button>
    </form>
  )
}
