const CACHE_NAME = "opensplit-shared"
const SESSION_KEY = "/shared/session"
const GROUP_KEY = "/shared/last-group"

export async function saveSession(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  try {
    const cache = await caches.open(CACHE_NAME)
    await cache.put(
      SESSION_KEY,
      new Response(
        JSON.stringify({
          access_token: accessToken,
          refresh_token: refreshToken,
        }),
      ),
    )
  } catch {
    // Cache API unavailable (HTTP, test env, etc.)
  }
}

export async function loadSession(): Promise<{
  access_token: string
  refresh_token: string
} | null> {
  try {
    const cache = await caches.open(CACHE_NAME)
    const response = await cache.match(SESSION_KEY)
    if (!response) return null
    return await response.json()
  } catch {
    return null
  }
}

export async function saveLastGroup(inviteToken: string): Promise<void> {
  try {
    const cache = await caches.open(CACHE_NAME)
    await cache.put(GROUP_KEY, new Response(inviteToken))
  } catch {
    // Cache API unavailable
  }
}

export async function loadLastGroup(): Promise<string | null> {
  try {
    const cache = await caches.open(CACHE_NAME)
    const response = await cache.match(GROUP_KEY)
    if (!response) return null
    return await response.text()
  } catch {
    return null
  }
}
