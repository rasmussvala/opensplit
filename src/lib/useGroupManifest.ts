import { useEffect } from "react"

const BASE = import.meta.env.BASE_URL

export function useGroupManifest(inviteToken: string) {
  useEffect(() => {
    const manifest = {
      name: "opensplit",
      short_name: "opensplit",
      description: "The simplest open source bill splitter.",
      theme_color: "#ffffff",
      background_color: "#ffffff",
      display: "standalone",
      scope: BASE,
      start_url: `${BASE}groups/${inviteToken}`,
      icons: [
        {
          src: `${BASE}icons/icon-192.png`,
          sizes: "192x192",
          type: "image/png",
        },
      ],
    }

    const dataUri = `data:application/manifest+json,${encodeURIComponent(
      JSON.stringify(manifest),
    )}`

    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
    const originalHref = link?.getAttribute("href")
    link?.setAttribute("href", dataUri)

    return () => {
      if (link && originalHref) link.setAttribute("href", originalHref)
    }
  }, [inviteToken])
}
