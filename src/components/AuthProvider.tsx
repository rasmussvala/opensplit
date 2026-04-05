import type { ReactNode } from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { ensureSession } from "@/lib/auth"

interface AuthContextValue {
  userId: string
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    ensureSession().then(setUserId)
  }, [])

  if (!userId) {
    return <div>Loading…</div>
  }

  return (
    <AuthContext.Provider value={{ userId }}>{children}</AuthContext.Provider>
  )
}
