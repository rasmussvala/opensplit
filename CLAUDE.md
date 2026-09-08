# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Always after code changes

```bash
npm run check:fix # biome lint + format fix (auto-write)
npm run typecheck
npm run test:coverage # tests + coverage (75% overall; 80% web src/lib/**, 90% core lib/**)
```

## Architecture

**Workspaces:** npm workspaces. `packages/core` (`@opensplit/core`) holds platform-agnostic
domain logic — `lib/` (pure helpers), `application/` (use cases), `infrastructure/supabase/`
(data sources). It has no DOM, no `import.meta.env`, and no Supabase singleton: each app
creates its own `SupabaseClient` and injects it at the composition root
(`src/application/composition.ts`). Core is consumed as TypeScript source, so it must stay
bundler-agnostic — relative imports only, no path aliases, no parameter properties.

The root package is the web app. Core has its own vitest + tsconfig; root `typecheck` and
`test:coverage` run both. Domain logic keeps its 90% `lib/**` coverage rule in `packages/core/vitest.config.ts`;
the web app's remaining `src/lib/**` platform glue is gated at 80%.

**Stack:** React 19 + TypeScript, Vite, Tailwind v4, shadcn/ui (Radix), Supabase (auth + DB + Realtime), deployed to GitHub Pages.

**Auth:** Anonymous Supabase sessions only — no accounts.

**UI components:** `src/components/ui/` are shadcn primitives — edit sparingly. Feature components live in domain folders

**Database:** Supabase with RLS enabled. Migrations in `supabase/migrations/`. All tables use Postgres RLS; anonymous users can only access groups they are members of.

## Agent skills

### Issue tracker

Issues and specs live in GitHub Issues; use `gh`. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repo using root `CONTEXT.md` and `docs/adr/`. See `docs/agents/domain.md`.
