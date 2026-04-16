import { loadSession, saveSession } from "@/lib/shared-storage"
import { supabase } from "@/lib/supabase"

export async function ensureSession(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session?.user) {
    saveSession(session.access_token, session.refresh_token)
    return session.user.id
  }

  // Try restoring session from Cache Storage (shared between Safari and PWA on iOS)
  const cached = await loadSession()
  if (cached) {
    const { data } = await supabase.auth.setSession(cached)
    if (data.session?.user) {
      saveSession(data.session.access_token, data.session.refresh_token)
      return data.session.user.id
    }
  }

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error || !data.user) {
    throw new Error("Failed to create anonymous session")
  }
  saveSession(
    data.session?.access_token ?? "",
    data.session?.refresh_token ?? "",
  )
  return data.user.id
}
