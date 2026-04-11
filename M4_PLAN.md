# M4: Group Page UI

## Context

After creating a group, `CreateGroup` navigates to `/groups/:invite_token` — but that route doesn't exist yet. We need to build the group page: the join flow, member list, expense management, balance display, and settlement. This is the core UI for M4.

The business logic (balance calculation, debt simplification) is fully implemented and tested. The database schema with RLS is complete. We're wiring the UI to the existing backend.

---

## Phase 1: Route + Join Flow ✅

**Goal:** Users can open an invite link, join a group, and see the group page.

### What was built:
- `src/lib/types.ts` — shared DB row types (DbGroup, DbGroupMember, DbExpense, DbSettlement)
- `src/components/group/JoinGroup.tsx` — display name form
- `src/components/group/GroupPage.tsx` — orchestrator with state machine (loading → not-found / join / member)
- `src/App.tsx` — `/groups/:inviteToken` route outside AdminRoute

### GroupPage state machine:
1. Read `inviteToken` from `useParams()`
2. Query `groups` by `invite_token` (RLS: open to all authenticated)
3. If not found → show error
4. Query `group_members` filtered by `group_id` + `user_id` (non-members get empty result, not error)
5. If member found → show group view (fetches members + expenses in parallel)
6. If no member → show `<JoinGroup />` form

### JoinGroup component:
- Single input: `guest_name`
- On submit: `supabase.from("group_members").insert({ group_id, guest_name, user_id })`
- Calls `onJoined()` callback → GroupPage re-fetches and transitions to member view

---

## Phase 2: Member List + Invite Link ✅

**Goal:** Members see who's in the group and can share the invite link.

### What was built:
- `src/components/group/InviteLink.tsx` — shows URL + copy button
- `src/components/group/MemberList.tsx` — renders guest_name list

### Wired into GroupPage member view:
- Group name as heading
- `<InviteLink inviteToken={group.invite_token} />`
- `<MemberList members={members} />`

---

## Phase 3: Expenses ✅

**Goal:** Members can add, edit, and delete expenses.

### What was built:

**Deviation from original plan:** Instead of inline editing via Dialog, expenses use separate page routes for better mobile UX.

#### File structure (reorganized into `expense/` subfolder):
- `src/components/expense/AddExpense.tsx` — the expense form (description, amount, paid by, split among)
- `src/components/expense/AddExpensePage.tsx` — page wrapper at `/groups/:inviteToken/add-expense`
- `src/components/expense/EditExpensePage.tsx` — page wrapper at `/groups/:inviteToken/edit-expense/:expenseId` (handles loading, save, delete)
- `src/components/expense/ExpenseItemEdit.tsx` — reusable edit form (used by EditExpensePage)
- `src/components/expense/ExpenseItemView.tsx` — read-only expense display (description, amount, date, paid by, split among)
- `src/components/expense/ExpenseList.tsx` — list of expenses linking to edit pages

#### Routes added to App.tsx:
```tsx
<Route path="/groups/:inviteToken/add-expense" element={<AddExpensePage />} />
<Route path="/groups/:inviteToken/edit-expense/:expenseId" element={<EditExpensePage />} />
```

#### UI pattern:
- GroupPage shows a floating "+" FAB button to navigate to AddExpensePage
- Each expense in the list is a `<Link>` to its EditExpensePage
- EditExpensePage has Save, Cancel, and Delete buttons
- Back arrow navigation to group page

#### Data notes:
- `paid_by` and `split_among` use `group_members.id` (not `user_id`)
- `amount` from Supabase may come as string for `numeric(12,2)` — wrapped with `Number()`
- `formatAmount(currency, amount)` helper in `src/lib/utils.ts`

#### Not implemented from original plan:
- Split percentage display next to checkboxes (plan said "50%" each, "33.3%" etc.)
- shadcn form components — expense forms use native HTML `<input>`, `<select>`, `<input type="checkbox">` instead of shadcn `Input`, `Select`, `Checkbox`

### Tests:
- `src/components/expense/AddExpense.test.tsx`
- `src/components/expense/ExpenseList.test.tsx`

---

## Additional work outside original plan

### Admin Page (commit `56c1c79`)
- `src/components/admin/AdminPage.tsx` — replaces `CreateGroup` as the root route, shows both CreateGroup form and a list of existing groups
- `src/components/admin/GroupList.tsx` — fetches all groups with member counts, renders as cards linking to group pages

### File reorganization (commit `5e035d9`)
All components moved into subfolders:
- `src/components/group/` — GroupPage, JoinGroup, CreateGroup, InviteLink, MemberList
- `src/components/expense/` — AddExpense, ExpenseList, ExpenseItemView, ExpenseItemEdit, AddExpensePage, EditExpensePage
- `src/components/admin/` — AdminPage, GroupList
- `src/components/auth/` — AuthProvider, AdminRoute

---

## Phase 4: Balances + Settlement ✅

**Goal:** Members see who owes whom and can mark debts as settled.

### What was built:
- `src/components/balance/BalanceSummary.tsx` — balance display + settlement flow
- `src/components/balance/BalanceSummary.test.tsx` — component tests

### Changes to GroupPage:
- Fetches settlements alongside members and expenses
- `DbSettlement[]` added to state
- Settlements passed to BalanceSummary

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

### Follow-up fixes:
- `cb9a04c` — eliminate zero-amount debts from floating-point rounding
- `687182b` — resolve biome non-null assertion warning in test

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
  - **Exception:** AddExpensePage and EditExpensePage are separate routes that fetch their own data (group membership verification + members list).
- **No data layer abstraction.** Direct Supabase calls, consistent with existing pattern.
- **TDD throughout.** Test file first (red), then implementation (green), then `npm run check:fix`.
- **Test mocking pattern** follows `CreateGroup.test.tsx`: mock `supabase.from`, mock `useAuth`, mock `useParams`, use `MemoryRouter`.

## Existing code to reuse
- `calculateBalances()` from `src/lib/balances.ts`
- `simplifyDebts()` from `src/lib/simplify.ts`
- `useAuth()` from `src/components/auth/AuthProvider.tsx`
- `supabase` client from `src/lib/supabase.ts`
- `formatAmount()` from `src/lib/utils.ts`
- `Button`, `Badge`, `Card` from `src/components/ui/`
- Test mock pattern from `src/components/group/CreateGroup.test.tsx`

## Commit Strategy

One commit per phase. Each commit is self-contained (tests pass, Biome clean, builds).

| Commit | Message                                                                | Status |
|--------|------------------------------------------------------------------------|--------|
| 1      | `phase 1: add group page with join flow`                               | ✅      |
| 2      | `phase 2: add member list and invite link sharing`                     | ✅      |
| 3      | `phase 3: add expense creation, editing, and deletion`                 | ✅      |
| 3a     | `refactor: move files to folders`                                      | ✅      |
| 3b     | `refactor: create ExpenseItems`                                        | ✅      |
| 3c     | `add seed data for local dev`                                          | ✅      |
| 3d     | `fix some styling`                                                     | ✅      |
| 3e     | `add admin page with group management`                                 | ✅      |
| 3f     | `polish: better ui in group`                                           | ✅      |
| 3g     | `add expense page`                                                     | ✅      |
| 4      | `phase 4: add balance summary and settlement flow`                     | ✅      |
| 4a     | `fix: eliminate zero-amount debts from floating-point rounding`        | ✅      |
| 4b     | `fix: resolve biome non-null assertion warning in BalanceSummary test` | ✅      |
| 5      | `phase 5: add real-time updates via Supabase Realtime`                 |        |

## Verification

After each phase, **before continuing to the next phase**:
1. `npm run test` — all tests pass
2. `npm run check:fix` — Biome clean
3. `npm run build` — no type errors
4. Commit the phase
5. User does manual testing
6. Only then proceed to the next phase
