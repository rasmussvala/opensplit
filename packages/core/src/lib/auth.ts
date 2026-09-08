import type { SupabaseClient } from "@supabase/supabase-js"

export async function ensureSession(client: SupabaseClient): Promise<string> {
  const {
    data: { session },
  } = await client.auth.getSession()

  if (session?.user) {
    return session.user.id
  }

  const { data, error } = await client.auth.signInAnonymously()
  if (error || !data.user) {
    throw new Error("Failed to create anonymous session")
  }
  return data.user.id
}
