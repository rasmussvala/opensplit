# OpenSplit — PWA-first home & code-based invites

## Context

OpenSplit is web-first, but the intended mobile experience is "add to home screen → use like an app." Two problems block that today:

1. **Deep links break once added to the home screen.** Sharing `/groups/:inviteToken` works in a browser tab but not reliably from an installed PWA, and the add-to-home-screen step confuses non-technical users.
2. **The landing page is the wrong thing.** `/` is an admin page (client-side PIN gate via `AdminRoute`) that lists *all* groups in the DB. There is no "groups I joined" view.

Goal: make `/` a friendly home that (a) guides first-time visitors to install the PWA, and (b) once installed, shows the groups you've joined plus a paste-a-code field to join more. Replace link-based invites with a copyable **code** (the existing `invite_token` UUID).

**Admin is repurposed, not removed.** Since OpenSplit is intended as an open-source, self-hosted tool, **only the hoster (admin) creates groups**; everyone else joins by code. The existing PIN gate is reused for this. Admins also get a full list of all groups for management.

**Decisions (confirmed with user):**
- **Code = raw `invite_token` UUID.** No DB migration.
- **Guide auto-surfaces on first visit** via standalone-display detection; installed users see the app home.
- **Instructional-only PWA.** No service worker added now (iOS add-to-home already works with the existing manifest + apple-touch-icon; Android native install prompt is deferred).
- **Admin = dedicated `/admin` route**, reached via a small admin icon on the home page. The route keeps today's flow exactly: PIN gate → see all groups + create. Home itself is public.
- **PIN stays cosmetic** (`VITE_ADMIN_PIN`, client-side). ⚠️ It's visible in the built JS bundle — not real security. The current RLS `groups_insert` policy is `with check (created_by = auth.uid())`, so *any* anonymous user can create a group; the PIN is the only gate. Acceptable per user; tightening the policy to an admin uid/role is deferred.

This is staged so each step is independently testable.

## Per-step workflow (applies to every step below)

After finishing each step, **stop** and do all of the following before moving on:
1. Run the full check suite: `npm run check:fix && npm run typecheck && npm run test:coverage` — all must pass (75% overall / 90% `src/lib/**`).
2. **Pause for manual testing** where the step has a user-visible change (marked 🧪 below). Run `npm run dev` and confirm before continuing.
3. **Commit** the step's progress on the feature branch. Conventional Commits format, ending with the `Co-Authored-By` trailer.

Branch: `feat/pwa-home-and-code-invites`.

---

## Step 0 — Create the feature branch (first action)

```bash
git checkout -b feat/pwa-home-and-code-invites
```
All step commits land on this branch; we open a PR at the end.

## Step 1 — Move home to `/`, admin to `/admin` 🧪

- In `src/App.tsx`: point `/` at a new `HomePage` (public — no PIN). Move the existing `<AdminRoute>` wrapper to gate a new **`/admin`** route that renders the current `AdminPage` (CreateGroup + all-groups `GroupList`) — i.e. today's exact flow, just relocated. Add a dedicated `/add-to-home` route.
- Keep `src/components/auth/AdminRoute.tsx` and `src/components/admin/AdminPage.tsx` essentially unchanged (PIN gate → CreateGroup + GroupList).
- **Fix GroupList member count:** the admin sees groups they're not a member of, and RLS (`is_group_member`) hides those member rows → the count shows 0/wrong. Remove the `group_members(count)` select and the member-count badge from `src/components/admin/GroupList.tsx`; the admin list shows name + currency only. (The user-facing `MyGroups` keeps the count — you're always a member of those.)
- New `src/components/home/HomePage.tsx` for `/`.
- **Admin entry point:** add a small, subtle admin icon (e.g. lucide `Settings`/`Shield`) in the home header corner that links to `/admin`. (Footer is an acceptable alternative location.)
- **Back navigation (lucide `ArrowLeft`, links to `/`):** add a back button to the top of `AdminPage` (so the admin can return home) and to `GroupHeader` (so a group view can return home). Both currently have no way back to the home page.

## Step 1.5 — Fix iOS standalone meta (REQUIRED for auto-guide to work) 🧪

Verified against [MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable): on iOS **before iOS 26**, a home-screen icon opens in a *Safari tab* (not standalone) unless `apple-mobile-web-app-capable` is set. `index.html` currently lacks it — so standalone detection would never flip, and the guide would show forever. Add to the `<head>`:
- `<meta name="apple-mobile-web-app-capable" content="yes">` (legacy iOS) **and** `<meta name="mobile-web-app-capable" content="yes">` (standard, replaces it)
- `<meta name="apple-mobile-web-app-title" content="opensplit">`
- `<meta name="theme-color" content="...">` (match chosen accent)
- In `public/manifest.json`: add `background_color` and `theme_color` (MDN lists these among recommended installability fields).

## Step 2 — Standalone detection + HomePage branching 🧪

- New hook `src/lib/useStandalone.ts`: returns whether the app is running installed. Per [web.dev/learn/pwa/detection](https://web.dev/learn/pwa/detection), treat any of `standalone` / `minimal-ui` / `fullscreen` display modes OR iOS `navigator.standalone` as installed:
  ```ts
  const installed =
    ["standalone", "minimal-ui", "fullscreen"].some(
      (m) => window.matchMedia(`(display-mode: ${m})`).matches,
    ) || (navigator as any).standalone === true
  ```
  Subscribe to changes via `matchMedia(...).addEventListener("change", ...)`.
- **Mobile detection** (`src/lib/useStandalone.ts` or a sibling `isMobileDevice()`): the guide only makes sense on mobile. Use the documented 2025 hybrid — Client Hints first, UA regex fallback, plus the iPadOS-13+ "Mac UA" catch:
  ```ts
  function isMobileDevice() {
    const uaData = (navigator as any).userAgentData
    if (uaData) return uaData.mobile // Chromium only
    const ua = navigator.userAgent
    if (/android|iphone|ipod/i.test(ua)) return true
    // iPadOS 13+ reports a desktop Mac UA (platform "MacIntel") — catch via touch
    return /ipad/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  }
  ```
  (`pointer: coarse` is rejected — it false-positives on touchscreen laptops.)
- `HomePage` branches:
  - **Desktop/laptop (any):** always render the app home directly — no guide. Desktop users just use it in the browser.
  - **Mobile, not installed:** render the `AddToHomeScreen` guide as primary content, with a small "Continue in browser" escape link that reveals the app home (don't hard-block in-browser mobile use).
  - **Mobile, installed (standalone):** render the app home.
- App home = `MyGroups` (your joined groups) + `JoinByCode`, plus the subtle admin icon linking to `/admin`.

## Step 3 — "Your groups" (membership-filtered) 🧪

- New `src/components/home/MyGroups.tsx` for the **user-facing** list (joined groups only). Keep `src/components/admin/GroupList.tsx` (the all-groups query) — it stays on the `/admin` page for management. Query joined groups via membership:
  ```ts
  supabase
    .from("group_members")
    .select("group:groups(*, group_members(count))")
    .eq("user_id", userId)
  ```
  Map rows → groups, reuse the existing Card layout and member-count rendering from `GroupList`. RLS already permits this (`groups_select` = `using(true)`; nested `group_members(count)` allowed by `is_group_member`). Use `userId` from `AuthProvider` (`useAuth`). The `group_members(count)` aggregate is valid Supabase syntax ([docs](https://supabase.com/docs/guides/database/joins-and-nesting)); since `group_members` appears twice in the query (the outer table and the nested count), it may need an explicit FK-relationship hint (e.g. `group:groups(*, members:group_members(count))`) to disambiguate — verify when implementing.
- Keep `CreateGroup.tsx` as-is functionally (move into `home/`); it already redirects to `/groups/:inviteToken` after create, which now also auto-adds you as a member via the join flow.

## Step 4 — Join by code (reuse existing route) 🧪

- New `src/components/home/JoinByCode.tsx`: a text input + button. On submit, `navigate(\`/groups/${code.trim()}\`)`. This reuses `GroupPage`'s existing lookup-by-`invite_token` → `JoinGroup` flow. No new join logic, no RLS change.
- Trim/normalize input; the bad-code case is already handled — `GroupPage` renders "Group not found".

## Step 5 — Invites become codes, not links 🧪

- Rename/replace `src/components/group/InviteLink.tsx` → `InviteCode.tsx`: copy the raw `inviteToken` (drop the `window.location.origin + BASE_URL + groups/` URL construction). Button label "Copy code" / "Copied!". Show the code text so it can be read aloud too.
- Update the single usage site: `GroupHeader.tsx` (`<InviteLink inviteToken={group.invite_token} />`). Keep the prop name `inviteToken`.
- Update tests: rename/rewrite `src/components/group/InviteLink.test.tsx` (currently asserts a shared **URL** → now asserts the bare code copied) and `GroupHeader.test.tsx` ("renders the share-link button").

## Step 6 — The add-to-home-screen guide (design-forward) 🧪

- New `src/components/home/AddToHomeScreen.tsx` with an **iOS** / **Android** segmented toggle (shadcn `Tabs` or a simple two-button switch), each showing numbered, illustrated steps (Share → "Add to Home Screen" for iOS; ⋮ menu → "Install app" / "Add to Home screen" for Android).
- **Design direction:** this is the first thing new users see — make it feel like a real product onboarding, not a settings dump. Cohesive with the existing shadcn/Tailwind system but elevated: a warm, confident single-accent palette, a distinctive display font for the headline paired with the existing body font, generous spacing, large rounded step cards with platform glyphs, and a staggered load-in reveal (animation-delay). Refined, not maximalist. Default-detect the platform (`/iphone|ipad|ipod/i` vs `/android/i` on `navigator.userAgent`) to preselect the right tab.

## Things to keep in mind (out of scope, flagged)

- **Storage is per-context, NOT shared between Safari and the installed PWA (confirmed iOS behavior).** Cookies / localStorage / IndexedDB are isolated; only Service Worker + CacheStorage are shared (since iOS 14). Consequences:
  - The admin PIN must be entered separately in the browser and in the PWA — expected, unavoidable.
  - The **anonymous Supabase session** (stored in localStorage) is also separate, so the anon `user_id` differs between Safari and the PWA. A group joined in the browser will **not** appear in the installed PWA.
  - **This is why the design is install-first:** the guide pushes installing first, then joining by code *inside* the PWA, so that instance stays self-consistent. Avoid the "join in browser → open PWA" path. Clearing data / reinstalling still loses the session and re-joining creates a new member row — inherent to the anon-auth model; not addressed here.
- **Android native install prompt** is deferred (no service worker). Revisit if Android install friction matters.

## Verification

- `npm run check:fix && npm run typecheck && npm run test:coverage` (must hold 75% overall / 90% `src/lib/**`). Add tests for: `MyGroups` (filtered query, empty state), `JoinByCode` (navigates to `/groups/:code`), `useStandalone`, and `InviteCode` (copies the bare token, not a URL). `AdminRoute`/`AdminPage` tests stay as-is (flow unchanged, just at `/admin`); update any `GroupList` test that asserted the member count (now removed there).
- Manual: `npm run dev`.
  - **Desktop browser** → `/` shows the app home directly (no guide).
  - **Mobile browser** (devtools device emulation / real phone, not installed) → `/` shows the guide; "Continue in browser" reveals home.
  - Home shows your groups + join field + a small admin icon. Tap icon → `/admin` → PIN gate → CreateGroup + all-groups list (today's flow).
  - Create a group (as admin) → land in group → header shows **Copy code** (bare UUID, no URL).
  - Open `/` in a second anon session, paste the code into **Join by code** → lands on the join form → after joining, the group appears in **Your groups**.
  - Simulate installed: Chrome devtools → emulate `display-mode: standalone` (or test from an actual home-screen install) → `/` shows app home directly.
  - Check `/add-to-home` renders the guide with iOS/Android toggle and correct platform preselected.
