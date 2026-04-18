import { useAppVersion } from "@/lib/utils.ts"

export default function AppFooter() {
  const version = useAppVersion()

  return (
    <footer className="border-t px-6 py-4 text-center text-sm text-muted-foreground">
      <p>Made with ♥</p>
      <p>
        v{version} ·{" "}
        <a
          className="rounded-sm font-medium text-foreground underline decoration-primary/60 underline-offset-4 transition-colors hover:text-primary hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          href="https://github.com/rasmussvala"
          rel="noreferrer"
          target="_blank"
        >
          rasmussvala
        </a>
      </p>
    </footer>
  )
}
