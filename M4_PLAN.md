# M4: Group Page UI

## Context

After creating a group, `CreateGroup` navigates to `/groups/:invite_token` — but that route doesn't exist yet. We need to build the group page: the join flow, member list, expense management, balance display, and settlement. This is the core UI for M4.

The business logic (balance calculation, debt simplification) is fully implemented and tested. The database schema with RLS is complete. We're wiring the UI to the existing backend.

---

## Phase 1: Route + Join Flow

**Goal:** Users can open an invite link, join a group, and see the group page.

### Files to create/modify:
- `src/lib/types.ts` — shared DB row types (Group, GroupMember, DbExpense, DbSettlement)
- `src/components/JoinGroup.test.tsx` → `src/components/JoinGroup.tsx` — display name form
- `src/components/GroupPage.test.tsx` → `src/components/GroupPage.tsx` — orchestrator with state machine (loading → not-found / join / member)
- `src/App.tsx` — add `/groups/:inviteToken` route **outside** AdminRoute

### GroupPage state machine:
1. Read `inviteToken` from `useParams()`
2. Query `groups` by `invite_token` (RLS: open to all authenticated)
3. If not found → show error
4. Query `group_members` filtered by `group_id` + `user_id` (non-members get empty result, not error)
5. If member found → show group view
6. If no member → show `<JoinGroup />` form

### JoinGroup component:
- Single input: `guest_name`
- On submit: `supabase.from("group_members").insert({ group_id, guest_name, user_id })`
- Calls `onJoined()` callback → GroupPage re-fetches and transitions to member view

### Route change in App.tsx:
```tsx
<Route element={<AdminRoute />}>
  <Route path="/" element={<CreateGroup />} />
</Route>
<Route path="/groups/:inviteToken" element={<GroupPage />} />
```

### Manual test:
- Create a group → redirected to `/groups/:inviteToken`
- See the join form → enter name → join → see group page

---

## Phase 2: Member List + Invite Link

**Goal:** Members see who's in the group and can share the invite link.

### Files to create:
- `src/components/InviteLink.test.tsx` → `src/components/InviteLink.tsx` — shows URL + copy button
- `src/components/MemberList.test.tsx` → `src/components/MemberList.tsx` — renders guest_name list

### Wire into GroupPage member view:
- Group name as heading + currency badge
- `<InviteLink inviteToken={group.invite_token} />`
- `<MemberList members={members} />`

### InviteLink URL construction:
```ts
window.location.origin + import.meta.env.BASE_URL + "groups/" + inviteToken
```

### Manual test:
- Join a group → see member list with your name
- Copy invite link → open in incognito → join as second member → see both names

---

## Phase 3: Expenses

**Goal:** Members can add, edit, and delete expenses.

### Files to create:
- `src/components/AddExpense.test.tsx` → `src/components/AddExpense.tsx`
- `src/components/ExpenseList.test.tsx` → `src/components/ExpenseList.tsx`

### shadcn components to install:
`npx shadcn@latest add input card dialog checkbox select badge`

### AddExpense form fields:
- Description (text input)
- Amount (number input)
- Who paid (select from members — uses `group_members.id`)
- Split among (checkboxes per member, all checked by default — uses `group_members.id`)
- **Split percentage display**: Next to each checked member, show the calculated percentage (1 decimal max). E.g. 2 members checked → "50%" each, 3 members → "33.3%" each. Updates live as members are toggled. Formula: `(100 / checkedCount).toFixed(1)` with trailing `.0` stripped.

### ExpenseList:
- Each expense: description, formatted amount (`{currency} {amount.toFixed(2)}`), paid by name, split among names
- Edit → Dialog with pre-filled form → `supabase.from("expenses").update(...)`
- Delete → `supabase.from("expenses").delete(...)`

### Data note:
- `paid_by` and `split_among` use `group_members.id` (not `user_id`)
- `amount` from Supabase may come as string for `numeric(12,2)` — wrap with `Number()`
- Add `formatAmount(currency, amount)` helper to `src/lib/utils.ts`

### Manual test:
- Add an expense → see it in the list with correct formatting
- Edit the expense → verify changes
- Delete the expense → verify removal
- Check percentage display updates as members are toggled

---

## Phase 4: Balances + Settlement

**Goal:** Members see who owes whom and can mark debts as settled.

### Files to create:
- `src/components/BalanceSummary.test.tsx` → `src/components/BalanceSummary.tsx`

### Processing pipeline (client-side, reusing existing libs):
1. Map DB expenses → `Expense` interface from `balances.ts`
2. Map DB settlements → `Settlement` interface from `balances.ts`
3. `calculateBalances(expenses, settlements)` → per-member net balances
4. `simplifyDebts(balances)` → minimal transaction list

### Display:
- Per-member balances with color coding (green positive, red negative)
- Simplified payments: "Bob owes Alice USD 15.00" + Settle button
- Settle → inserts `settlements` row → triggers refetch
- "All settled up" state when balances are zero

### Member name resolution:
Build `Map<string, string>` of `member.id → member.guest_name` for display.

### Manual test:
- Add expenses between members → see correct balances
- See simplified "who owes whom" transactions
- Settle a debt → balances update to reflect settlement
- Settle all debts → see "All settled up"

---

## Phase 5: Real-time Updates

**Goal:** Changes by other users appear automatically.

### Migration required (per Supabase docs):
Tables must be added to the `supabase_realtime` publication before subscriptions work. Create a new migration:

```sql
alter publication supabase_realtime add table expenses;
alter publication supabase_realtime add table settlements;
alter publication supabase_realtime add table group_members;
```

### In GroupPage, subscribe to Supabase Realtime:
```ts
supabase.channel(`group-${group.id}`)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses', filter: `group_id=eq.${group.id}` }, refetch)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'settlements', filter: `group_id=eq.${group.id}` }, refetch)
  .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members', filter: `group_id=eq.${group.id}` }, refetch)
  .subscribe()
```
Clean up on unmount.

### Manual test:
- Open group in two browser windows
- Add expense in window 1 → appears in window 2
- Join as new member in window 2 → member list updates in window 1

---

## Architecture Decisions

- **GroupPage owns all state.** Fetches group, members, expenses, settlements. Passes down as props. Child components get data + callbacks, never fetch independently.
- **No data layer abstraction.** Direct Supabase calls, consistent with existing `CreateGroup.tsx` pattern.
- **TDD throughout.** Test file first (red), then implementation (green), then `npm run check:fix`.
- **Test mocking pattern** follows `CreateGroup.test.tsx`: mock `supabase.from`, mock `useAuth`, mock `useParams`, use `MemoryRouter`.

## Existing code to reuse
- `calculateBalances()` from `src/lib/balances.ts`
- `simplifyDebts()` from `src/lib/simplify.ts`
- `useAuth()` from `src/components/AuthProvider.tsx`
- `supabase` client from `src/lib/supabase.ts`
- `Button` from `src/components/ui/button.tsx`
- Test mock pattern from `src/components/CreateGroup.test.tsx`

## Commit Strategy

One commit per phase. Each commit is self-contained (tests pass, Biome clean, builds).

| Commit | Message |
|--------|---------|
| 1 | `phase 1: add group page with join flow` |
| 2 | `phase 2: add member list and invite link sharing` |
| 3 | `phase 3: add expense creation, editing, and deletion` |
| 4 | `phase 4: add balance summary and settlement flow` |
| 5 | `phase 5: add real-time updates via Supabase Realtime` |

## Verification

After each phase, **before continuing to the next phase**:
1. `npm run test` — all tests pass
2. `npm run check:fix` — Biome clean
3. `npm run build` — no type errors
4. Commit the phase
5. User does manual testing
6. Only then proceed to the next phase
