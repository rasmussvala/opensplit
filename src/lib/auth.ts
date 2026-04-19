import { loadSession, saveSession } from "@/lib/shared-storage"
import { supabase } from "@/lib/supabase"

export async function ensureSession(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session?.user) {
    await saveSession(session.access_token, session.refresh_token)
    return session.user.id
  }

  const cached = await loadSession()
  if (cached) {
    const { data } = await supabase.auth.setSession(cached)
    if (data.session?.user) {
      await saveSession(data.session.access_token, data.session.refresh_token)
      return data.session.user.id
    }
  }

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error || !data.user) {
    throw new Error("Failed to create anonymous session")
  }
  await saveSession(
    data.session?.access_token ?? "",
    data.session?.refresh_token ?? "",
  )
  return data.user.id
}
