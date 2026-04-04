# opensplit — Project Specification

**Version:** 1.0 (Draft)  
**Date:** 2026-04-04  
**Status:** In development

## Dev Workflow

- Always run `npm run check:fix` (Biome) after adding or modifying code.

---

---

## 1. Overview

**opensplit** — The simplest open source bill splitter. Fork it, connect your own Supabase, and host it free on GitHub Pages.

A simple, open source, self-hostable bill-splitting web app. A privacy-friendly alternative to Splitwise with a focus on simplicity, ease of self-hosting, and a clean mobile experience via PWA.

---

## 2. Goals

- Make it easy for small groups to track shared expenses and see who owes whom
- Keep it simple — no feature bloat
- Fully open source and self-hostable (including on a Raspberry Pi)
- Works great on mobile via PWA (no app store required)

---

## 3. Non-Goals (explicitly out of scope for v1)

- Multi-currency support (cross-group conversion)
- Recurring expenses
- Native iOS / Android apps
- Complex split types (percentages, shares) — equal splits only in v1
- Receipt scanning
- In-app payments

---

## 4. Target Users

- Roommates splitting household bills
- Friend groups tracking trip or dinner expenses
- Anyone who wants a self-hosted, private alternative to Splitwise

---

## 5. Platform

| Concern | Decision |
|---|---|
| Frontend | React + Vite (PWA) |
| Styling | Tailwind CSS v4 |
| Component Library | shadcn/ui (built on Radix UI, owned components) |
| Backend / DB | Supabase (open source, self-hosted per user) |
| Frontend Hosting | GitHub Pages (free, per fork) |
| DB Hosting | Supabase cloud free tier (per fork) |
| Schema Management | Supabase migration files (versioned in repo) |
| License | MIT |

---

## 6. Authentication

No accounts in v1. Access is link-based only.

- The fork owner (host/admin) creates groups via the root URL
- Friends access groups via shareable invite links (`/groups/:invite_token`)
- No login, no passwords, no sessions required

### 6.0 Admin PIN

Group creation is protected by a simple PIN set via the environment variable `VITE_ADMIN_PIN`. The CreateGroup page prompts for the PIN before showing the form. This is a client-side check — sufficient for v1 since the database is the admin's own Supabase instance. The PIN is stored in `localStorage` (`opensplit:admin_pin`) after the first successful entry so the admin doesn't have to re-enter it on every visit.

Accounts may be considered for a future version to enable cross-instance identity.

### 6.1 Member Identity (localStorage tokens)

Members are identified via a `member_token` stored in the browser's `localStorage`. There are no user accounts.

- When someone opens an invite link for the first time, they are prompted to enter a display name
- A new `group_members` row is created with a server-generated `member_token` (UUID)
- The `member_token` is stored in localStorage under the key `opensplit:member_token:<group_id>`
- On return visits, the stored `member_token` identifies the member — no login needed
- The admin/host goes through the same join flow when they first visit a group they created
- If localStorage is cleared (or a different browser/device is used), the visitor appears as a new member and must re-join
- The `member_token` is a secret separate from the member `id` — member IDs are visible in expenses and settlements, but the token is known only to the browser that created the membership

---

## 7. Core Features (v1)

### 7.1 Groups
- Create a group with a name and a currency code (e.g. USD, NOK, EUR)
- Group creation only sets name and currency — no members are added at creation time
- Only the fork owner (host/admin) creates groups — no technical restriction, just URL-based access control
- Currency is set once at group creation and applies to all expenses in the group
- All amounts displayed as currency code + amount (e.g. "USD 42.50")
- No conversion between currencies — one group, one currency
- After creation, navigate to the group page where the invite link is available
- Members join by opening the shareable invite link (no email infrastructure needed)
- Link contains a unique unguessable token (UUID)
- Link revocation and regeneration is M6 scope
- The home page shows a list of groups derived from localStorage member tokens — any group you have joined appears in the list. If browser storage is cleared, the list is lost (memberships still exist in the database; re-join via invite link)

### 7.2 Expenses
- Add an expense: description, amount, who paid, split equally among selected members
- Edit or delete an expense
- View expense history for a group

### 7.3 Balances
- Automatically calculate simplified balances (who owes whom, minimum transactions)
- Debt simplification runs client-side
- Real-time updates when expenses are added

### 7.4 Settlement
- Mark a debt as settled (records a settlement event in history)
- Settled amounts reflected immediately in balances

### 7.5 Member Join Flow
1. User opens `/groups/:invite_token`
2. App looks up the group by `invite_token`
3. App checks `localStorage` for a stored `member_token` for this group
4. If a valid token is found and matches a `group_members` row — the user is identified and sees the group page
5. If no token is found (or it doesn't match) — the user sees a "Join group" prompt asking for their display name
6. On submit: a new `group_members` row is created, the returned `member_token` is stored in `localStorage`
7. The user is now a member and sees the group page

The admin/host goes through this same flow after creating a group.

---

## 8. Debt Simplification Algorithm

Runs client-side as a pure function.

**Input:** list of expenses for a group  
**Output:** simplified list of transactions (person A pays person B amount X)

**Steps:**
1. Calculate each member's net balance (total paid minus total owed)
2. Separate into creditors (positive balance) and debtors (negative balance)
3. Greedily match largest debtor with largest creditor
4. Settle as much as possible, repeat until all balances are zero

This minimises the number of transactions needed to settle a group.

---

## 9. Data Model

No `users` table in v1 — all identity is handled via `member_token` in `group_members` (see Section 6.1).

### Groups
| Field | Type |
|---|---|
| id | uuid (PK, auto-generated) |
| name | text, not null |
| currency | text, not null, default 'SEK' |
| invite_token | text, not null, default random UUID |
| created_at | timestamptz, not null, default now() |

### Group Members
| Field | Type |
|---|---|
| id | uuid (PK, auto-generated) |
| group_id | uuid, FK to groups(id), cascade delete |
| guest_name | text, not null |
| member_token | uuid, not null, default random UUID, unique |
| joined_at | timestamptz, not null, default now() |

### Expenses
| Field | Type |
|---|---|
| id | uuid (PK, auto-generated) |
| group_id | uuid, FK to groups(id), cascade delete |
| paid_by | uuid, FK to group_members(id) |
| amount | numeric(12,2), not null, check > 0 |
| description | text, not null |
| split_among | uuid[] (member ids) |
| created_at | timestamptz, not null, default now() |

### Settlements
| Field | Type |
|---|---|
| id | uuid (PK, auto-generated) |
| group_id | uuid, FK to groups(id), cascade delete |
| from_member | uuid, FK to group_members(id) |
| to_member | uuid, FK to group_members(id) |
| amount | numeric(12,2), not null, check > 0 |
| settled_at | timestamptz, not null, default now() |

---

## 10. Deployment Model

Each user owns and hosts their own instance. There is no central server.

### How it works

1. User forks the repo on GitHub
2. Creates a free Supabase project
3. Runs the migration files to set up the schema
4. Adds Supabase credentials as GitHub repository secrets
5. Pushes — GitHub Actions automatically deploys frontend to GitHub Pages

The fork owner becomes the de facto admin. Their friends access the app via their GitHub Pages URL and trust them as the host.

### Repository Structure

```
/
├── src/                  # React frontend
├── supabase/
│   └── migrations/       # Versioned SQL migration files
├── .env.example          # Template for required credentials
└── .github/
    └── workflows/
        └── deploy.yml    # Auto-deploy to GitHub Pages
```

### GitHub Secrets Required

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `VITE_ADMIN_PIN`
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_PROJECT_ID`

---

## 11. Development Methodology

### TDD — Red, Green, Refactor

All features are developed using a three-phase TDD cycle:

1. **Red** — write a failing test that describes the desired behaviour
2. **Green** — write the simplest possible code to make the test pass
3. **Refactor** — clean up the code without breaking the test

### Testing Strategy

| Layer | Tool | Scope |
|---|---|---|
| Unit tests | Vitest | Debt algorithm, expense calculations, pure logic |
| Component tests | React Testing Library + Vitest | Key UI interactions (add expense, view balances) |
| End-to-end | — | Out of scope for v1 |

End-to-end tests (e.g. Playwright) are explicitly skipped in v1 due to overhead. Can be added in a future version when the app is stable and has more contributors.

---

- Web App Manifest (name, icons, theme color)
- Service Worker for offline caching of app shell
- HTTPS required (use a reverse proxy like Caddy or Nginx with Let's Encrypt)
- "Add to Home Screen" prompt on mobile

---

## 12. Open Source Setup

| Item | Detail |
|---|---|
| Repository | GitHub |
| License | MIT |
| README | Install guide, quick start, screenshots |
| Issues | Bug reports and feature requests via GitHub Issues |
| Contributions | Fork and PR — no formal contribution guide in v1 |
| CI/CD | GitHub Actions — lint, test, build, publish Docker images |
| Docker Hub | Multi-arch images published on each release tag |

---

## 13. Milestones

| Milestone | Scope | Status |
|---|---|---|
| M1 — Foundation | Repo setup, Supabase project, migration files, GitHub Actions deploy to Pages, Vitest configured, Tailwind + shadcn/ui installed | ✅ Done |
| M2 — Core | TDD: expense model, equal splits, balance calculation (unit tested) | ✅ Done |
| M3 — Simplification | TDD: debt simplification algorithm (unit tested), settlement flow | ✅ Done |
| M4 — UI | Component tests for key interactions, React UI wired to Supabase | 🟡 In progress |
| M5 — PWA | Manifest, service worker, offline shell | |
| M6 — Polish | Link revocation, mobile UI polish | |
| M7 — Release | README with setup guide, .env.example, Docker Hub publish, v1.0 tag | |

---

## 14. Out of Scope (Future Consideration)

- Percentages / custom split amounts
- Multi-currency conversion (each group has one currency, no exchange rates)
- Recurring expenses
- Activity feed / notifications
- Export to CSV
- Mobile native apps
- Email invites (links are sufficient)
- Redis / caching layer (not needed at this scale)
- Google / third-party OAuth
- User accounts and login (considered for v2)
- End-to-end tests / Playwright (considered for v2)
- Docker / self-hosted deployment (considered for v2)

---

*This spec is a living document and will be updated as decisions are made.*