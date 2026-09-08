# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Always after code changes

```bash
npm run check:fix # biome lint + format fix (auto-write)
npm run typecheck
npm run test:coverage # tests + coverage (75% overall, 80% for src/lib/**)
```

## Architecture

**Shared domain logic** lives in `@rasmussvala/opensplit-core`, a separate repo
(`rasmussvala/opensplit-core`) published to GitHub Packages and shared with the React Native
app. It holds `lib/` (pure helpers), `application/` (use cases) and `infrastructure/supabase/`
(data sources). It has no DOM and no Supabase singleton: this app creates the
`SupabaseClient` and injects it at the composition root (`src/application/composition.ts`).

Installing it needs a token with `read:packages`; CI uses the built-in `GITHUB_TOKEN`.
That token only works because the package grants this repo read access under
**Manage Actions access** in its package settings (the Codespaces box next to it does
not cover workflows). Without that grant `npm ci` fails with a 403 `read_package`.
Changing domain logic means releasing a new core version, then bumping it here.

This repo's `src/lib/**` is platform glue only (Supabase client, `cn`, PWA and device
checks), gated at 80% coverage; the domain's 90% rule lives in the core repo.

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
