import { useEffect, useState } from "react"

const DISPLAY_MODES = ["standalone", "minimal-ui", "fullscreen"] as const

function checkInstalled(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false
  const standaloneDisplay = DISPLAY_MODES.some(
    (mode) => window.matchMedia(`(display-mode: ${mode})`).matches,
  )
  // iOS Safari exposes navigator.standalone instead of display-mode.
  return (
    standaloneDisplay ||
    (navigator as { standalone?: boolean }).standalone === true
  )
}

/**
 * Whether the app is running as an installed PWA (home-screen launch),
 * reacting to display-mode changes.
 */
export function useStandalone(): boolean {
  const [installed, setInstalled] = useState(checkInstalled)

  useEffect(() => {
    if (!window.matchMedia) return
    const queries = DISPLAY_MODES.map((mode) =>
      window.matchMedia(`(display-mode: ${mode})`),
    )
    const handler = () => setInstalled(checkInstalled())
    for (const query of queries) query.addEventListener("change", handler)
    return () => {
      for (const query of queries) query.removeEventListener("change", handler)
    }
  }, [])

  return installed
}

/**
 * Whether this is a mobile device, where "add to home screen" makes sense.
 * Prefers Client Hints, falls back to UA, and catches iPadOS 13+ (which
 * reports a desktop Mac UA) via touch points.
 */
export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false

  const uaData = (navigator as { userAgentData?: { mobile?: boolean } })
    .userAgentData
  if (uaData && typeof uaData.mobile === "boolean") return uaData.mobile

  const ua = navigator.userAgent
  if (/android|iphone|ipod/i.test(ua)) return true
  return (
    /ipad/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  )
}
