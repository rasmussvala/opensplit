import { useState } from "react"
import { Outlet } from "react-router-dom"
import { Button } from "@/components/ui/button"

const STORAGE_KEY = "opensplit:admin_pin"

function getAdminPin(): string {
  return import.meta.env.VITE_ADMIN_PIN ?? ""
}

function isAuthorized(): boolean {
  return localStorage.getItem(STORAGE_KEY) === getAdminPin()
}

export default function AdminRoute() {
  const [authorized, setAuthorized] = useState(isAuthorized)
  const [pin, setPin] = useState("")
  const [pinError, setPinError] = useState(false)

  function handlePinSubmit(e: React.SubmitEvent) {
    e.preventDefault()
    if (pin === getAdminPin()) {
      localStorage.setItem(STORAGE_KEY, pin)
      setAuthorized(true)
      setPinError(false)
    } else {
      setPinError(true)
    }
  }

  if (!authorized) {
    return (
      <form
        onSubmit={handlePinSubmit}
        className="mx-auto flex max-w-sm flex-col gap-4 p-6"
      >
        <h1 className="text-2xl font-bold">Admin PIN</h1>
        <div className="flex flex-col gap-1">
          <label htmlFor="admin-pin" className="text-sm font-medium">
            Enter PIN to create groups
          </label>
          <input
            id="admin-pin"
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="rounded border px-3 py-2 text-base md:text-sm"
          />
          {pinError && <p className="text-sm text-red-600">Incorrect PIN</p>}
        </div>
        <Button type="submit">Submit</Button>
      </form>
    )
  }

  return <Outlet />
}
