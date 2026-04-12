import { useAppVersion } from "@/lib/utils.ts"

export default function AppFooter() {
  const version = useAppVersion()

  return (
    <footer className="border-t px-6 py-4 text-center text-sm text-muted-foreground">
      <p>Version {version}</p>
      <p>Made with love by Rasmus</p>
    </footer>
  )
}
