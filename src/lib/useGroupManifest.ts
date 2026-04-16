import { useEffect } from "react"

const BASE = import.meta.env.BASE_URL

export function useGroupManifest(groupName: string, inviteToken: string) {
  useEffect(() => {
    const manifest = {
      name: groupName,
      short_name: groupName,
      description: "The simplest open source bill splitter.",
      theme_color: "#ffffff",
      background_color: "#ffffff",
      display: "standalone",
      scope: BASE,
      start_url: `${BASE}groups/${inviteToken}`,
      icons: [
        {
          src: `${BASE}icons/android/android-icon-192x192.png`,
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: `${BASE}icons/android/android-icon-512x512.png`,
          sizes: "512x512",
          type: "image/png",
        },
        {
          src: `${BASE}icons/android/android-icon-512x512.png`,
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    }

    const content = encodeURIComponent(JSON.stringify(manifest))
    const dataUri = `data:application/manifest+json,${content}`

    // Swap manifest link
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
    const originalHref = link?.getAttribute("href")
    link?.setAttribute("href", dataUri)

    // iOS: apple-mobile-web-app-title takes priority over manifest name
    const metaTitle = document.querySelector<HTMLMetaElement>(
      'meta[name="apple-mobile-web-app-title"]',
    )
    const originalMetaTitle = metaTitle?.getAttribute("content")
    metaTitle?.setAttribute("content", groupName)

    // Page title
    const originalTitle = document.title
    document.title = groupName

    return () => {
      if (link && originalHref) link.setAttribute("href", originalHref)
      if (metaTitle && originalMetaTitle)
        metaTitle.setAttribute("content", originalMetaTitle)
      document.title = originalTitle
    }
  }, [groupName, inviteToken])
}
