import { supabase } from "@/lib/supabase"

export async function ensureSession(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session?.user) {
    return session.user.id
  }

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error || !data.user) {
    throw new Error("Failed to create anonymous session")
  }
  return data.user.id
}
