# Custom Split — Living Plan

> Status: **in progress**. Living doc — update as decisions change. Checked into the repo so contributors can see current direction.

## Context

Today expenses are split equally across every member in `split_among`. We're adding per-member overrides so some members can pay a fixed amount or a fixed percentage of the bill, and the remaining members split the leftover equally.

Example: on a 500 SEK bill Bob pays 300 SEK and everyone else splits the remaining 200 equally.

A global mode toggle (`%` / currency) will sit in the top-right of the "Split among" header. Each member row gets a small numeric input to the left of the checkbox. For **checked** members the input always shows a value — live-computed auto share (non-bold) or user-entered override (bold). **Unchecked** members (not in `split_among`) show an empty, disabled input. Clearing the value on a checked member reverts that row to auto.

iOS Safari zooms the viewport when a focused input's font-size is < 16px. The override input uses `text-base` (16px) to prevent this.

All UI lives inside `src/components/expense/ExpenseForm.tsx`. No separate breakdown component — the form shows the math live in-row.

---

## Design decisions (user-confirmed)

- **UI**: global `% | currency` segmented toggle top-right of "Split among"; per-row numeric input left of the check indicator; input always shows a value; bold = user-set override, non-bold = live-computed auto share. Clearing the input returns the row to auto.
- **Rounding drift**: absorb into payer. If per-member shares sum to `amount ± cents`, the delta is credited/debited to `paid_by`.
- **Breakdown display**: in-form, per-row share visible on the same list (not a separate component or page).
- **Backward compat**: existing expenses with no overrides render and calculate identically.
- **Plan for best practice validation**: research confirms JSONB acceptable for bounded semi-structured payloads; 16px prevents iOS zoom; `Number` + `round2` pattern stays consistent with existing money math.

---

## Data model

New nullable `jsonb` column on `expenses`. `null` = legacy equal split.

```sql
-- supabase/migrations/20260419000001_add_expense_split_overrides.sql
alter table expenses add column split_overrides jsonb;
```

Shape:

```ts
type SplitOverrides = {
  mode: "percent" | "amount"
  values: Record<string, number>   // memberId → raw value (only overridden members)
} | null
```

Normalize `{ mode, values: {} }` → `null` on write so the common case stays `null`.

**Type change** (`src/lib/types.ts`): extend `DbExpense` with `split_overrides: SplitOverrides`.

---

## Pure calc (`src/lib/balances.ts`)

Extend `Expense` with optional `split_overrides`. Helper `computeShares(expense): Record<memberId, number>`:

1. `overrides = expense.split_overrides` — if null/empty → equal split (current behavior).
2. For each `memberId` in `overrides.values` that's also in `split_among`:
   - `mode === "percent"` → `share = round2(value / 100 * amount)`
   - `mode === "amount"` → `share = round2(value)`
3. `remainder = amount − sum(overrideShares)`. `remainderMembers = split_among \ keys(overrides.values)`.
4. If `remainderMembers.length > 0` and `remainder > 0` → split `remainder` equally.
5. **Drift absorption**: `drift = amount − sum(allShares)`. Add `drift` to payer's share. If payer not in `split_among`, add a zero-share payer entry first.
6. Return share map.

`calculateBalances` delegates per-member share math to `computeShares`, then applies settlements + 2dp rounding as before.

---

## UI — ExpenseForm split section

Target visual (from user sketches):

```
SPLIT AMONG                                    [ % | SEK ]
┌────────────────────────────────────────────────────────┐
│ (R)  Rasmus                        ┌─────────┐   ┌──┐  │
│      200 SEK                       │ 200 SEK │   │✓ │  │
│                                    └─────────┘   └──┘  │
├────────────────────────────────────────────────────────┤
│ (S)  Sagis                         ┌─────────┐   ┌──┐  │
│      100 SEK                       │ 100 SEK │   │✓ │  │
│                                    └─────────┘   └──┘  │
├────────────────────────────────────────────────────────┤
│ (J)  Johis                         ┌─────────┐   ┌──┐  │
│      100 SEK                       │ 100 SEK │   │✓ │  │
│                                    └─────────┘   └──┘  │
└────────────────────────────────────────────────────────┘
```

Key ideas from the sketches:

- **Subtext under each name** always shows that member's true share **in the group's currency**, regardless of mode. This is the "what you actually pay" line — always SEK (or whatever the group uses).
- **Right-side input** shows the override value in the **current mode** (`%` or currency). Empty/disabled when the member is unchecked. Toggling the mode reinterprets the raw value (e.g. `200 SEK` ↔ `50 %` on a 400 SEK bill).
- **Top-right segmented toggle** switches between `%` and the group currency code. Uses the same pill-button styling as "Paid by".

So the subtext is the *output* (always currency), the input is the *control* (current mode).

Row layout (left→right):
- `MemberAvatar`
- name (top) + currency-share subtext (bottom)
- numeric input (`w-20`-ish, right-aligned, `text-base` for iOS)
- check indicator

Segmented toggle sits in the header row next to the "Split among" label.

Input behavior:

- **Unchecked row** (member not in `splitAmong`): input empty and disabled.
- **Checked row**: input always renders a value. If member is in `overrides.values` → raw value, bold (`font-semibold`). Else → live-computed auto share from current `amount`, `splitAmong`, `overrides`, `splitMode`, non-bold.
- On user typing any value → that member is promoted to an override (bold).
- Clearing the input and blurring → member reverts to auto (non-bold).
- Unchecking a member: clear any override for that member and empty the input.
- Re-checking a member: input resumes showing the live auto share.
- `type="text"`, `inputMode="decimal"`, regex filter `/^\d*\.?\d{0,2}$/`.
- `className` includes `text-base` (16px → no iOS zoom), `tabular-nums`, `text-right`.
- Width `w-16` fits `100.00`; suffix `%` shown in percent mode.
- Name label toggles `font-semibold` in sync with the input's bold state.
- Switching global mode preserves numeric values (they reinterpret under the new mode).

Summary strip below the list (muted, `text-xs`):

- No overrides: `"{N} people split {formatAmount(currency, amount)} equally"`.
- Some overrides, positive remainder: `"Remainder {formatAmount(currency, remainder)} split equally ({N} people)"`.
- All overridden, with drift: `"{payerName} covers {drift} rounding"`.
- Error (red, `text-destructive`, submit disabled): sum of overrides > amount, any percent > 100, any value < 0, no remainder members and sum < amount.

---

## Form state + submit

```ts
type OverrideDraft = { raw: string }
const [splitMode, setSplitMode] = useState<"percent" | "amount">(
  initialSplitOverrides?.mode ?? "percent",
)
const [overrides, setOverrides] = useState<Record<string, OverrideDraft>>(...)
```

`ExpenseFormData` extends:

```ts
export interface ExpenseFormData {
  description: string
  amount: number
  paidBy: string
  splitAmong: string[]
  splitOverrides: SplitOverrides   // null when empty
}
```

On submit: parse `raw` → number, drop entries where member not in `splitAmong` or `raw` empty/invalid; return `null` if no entries survive.

---

## Persistence wiring

- `AddExpensePage`: include `split_overrides` in insert payload.
- `EditExpensePage`: pass `initialSplitOverrides` from loaded expense; include in update payload.

---

## Tests

`src/lib/balances.test.ts` — new cases (done in Phase 1):
- Null split_overrides regression guard.
- Single percent override, rest equal.
- Single amount override, rest equal.
- All members overridden summing exactly.
- Drift absorption to payer (99.99 → 100).
- Payer not in split_among, drift still lands on payer.
- Stale override (member no longer in split_among) ignored.

`src/components/expense/ExpenseForm.test.tsx` — new cases:
- [Phase 2] Live share displayed for checked members once amount entered.
- [Phase 2] Unchecking a member removes that row's share and redistributes across remaining.
- [Phase 3] Mode toggle flips suffix and recomputes auto values.
- [Phase 3] Typing in a row bolds that row and shifts other auto rows' values.
- [Phase 4] Submitting with no overrides produces `splitOverrides: null`.
- [Phase 4] Submitting with one override produces correct shape + mode.
- [Phase 5] Error state disables submit when sum of overrides > amount.

`AddExpensePage.test.tsx` / `EditExpensePage.test.tsx` — round-trip `split_overrides` through insert/update (Phase 4).

---

## Files to change / add

| File | Action |
|---|---|
| `supabase/migrations/20260419000001_add_expense_split_overrides.sql` | **new** — add `split_overrides jsonb` ✅ P1 |
| `src/lib/types.ts` | extend `DbExpense` ✅ P1 |
| `src/lib/balances.ts` | `SplitOverrides` type, `computeShares`, update `calculateBalances` ✅ P1 |
| `src/lib/balances.test.ts` | new unit tests ✅ P1 |
| `src/components/expense/ExpenseForm.tsx` | live share display, mode toggle, per-row input, bold state, auto-share computation, summary, validation, extended `ExpenseFormData` 🟡 P2+P3+P4 done, P5 remaining |
| `src/components/expense/ExpenseForm.test.tsx` | new interaction tests 🟡 P2+P3+P4 done, P5 remaining |
| `src/components/expense/AddExpensePage.tsx` | include `split_overrides` in insert ✅ P4 |
| `src/components/expense/EditExpensePage.tsx` | hydrate + include in update ✅ P4 |
| `src/components/expense/AddExpensePage.test.tsx`, `EditExpensePage.test.tsx` | round-trip assertions ✅ P4 |

---

## Phased rollout — stop and verify between each

Each phase ends with `npm run check:fix` + `npm test` green and a manual smoke check. Do not start the next phase until the current one is verified.

### Phase 1 — Data + calc foundation (no user-visible change) ✅

Scope:
- Add migration `20260419000001_add_expense_split_overrides.sql`.
- Extend `DbExpense` type.
- Add `SplitOverrides` type + `computeShares` helper in `balances.ts`.
- Update `calculateBalances` to call `computeShares`.
- Add unit tests for `computeShares` + `calculateBalances` regression.

Verify:
- `npm test` green (balances tests).
- Open running app — existing balances unchanged.

### Phase 2 — Live share subtext under each name 🟡

Scope:
- Inside `ExpenseForm.tsx`, compute `shares = computeShares(...)` live from the current form state (null overrides for now).
- Render each checked member's share as a **small subtext line directly under the name**, always formatted in the group's currency (e.g. `100 SEK`). Uses `formatAmount`.
- Unchecked rows show no subtext.
- No right-side input yet, no mode toggle yet — those land in Phase 3.
- No new component, no breakdown surface elsewhere.

Verify:
- Open Add Expense form, fill an amount → each checked row has a subtext under the name showing that member's share, and the subtexts sum to the total.
- Uncheck a member → their subtext disappears and the remaining rows' subtexts redistribute.
- Edit Expense page shows subtexts on load.

### Phase 3 — Mode toggle + override inputs (no persistence yet) ✅

Scope:
- Add `splitMode` state + segmented `%`/currency toggle in the "Split among" header (top-right, sibling to the "Split among" label).
- Add a numeric input on the **right side of each row**, just before the check indicator. Input shows the live auto value in the current mode (auto-percent when `%`, auto-currency when `SEK`/etc).
- Input is empty + disabled on unchecked rows.
- Name stays the same; the currency-share **subtext under the name stays and continues to reflect the true share in the group's currency** regardless of mode.
- Typing promotes the row to an override: input value bolds, name bolds, subtext still reflects the resulting currency share.
- Clearing an override blurs back to auto.
- Toggle preserves raw values (reinterprets) — if a user typed `200 SEK` and flips to `%`, the input shows the equivalent percent of the current amount.
- Submit still sends `splitOverrides: null` (persistence wired in Phase 4).

Verify:
- Toggle `%` / currency → input values reinterpret; subtext stays in currency.
- Type in a row → input and name bold, subtext updates to actual currency share, other auto rows' inputs and subtexts update.
- Clear override → reverts to auto.
- Submit creates an equal-split expense as before.

### Phase 4 — Wire overrides end-to-end ✅

Scope:
- `ExpenseFormData` gets `splitOverrides`.
- `AddExpensePage` writes `split_overrides` on insert.
- `EditExpensePage` hydrates from `initialSplitOverrides` and writes on update.
- Unchecking a member clears that member's override.

Verify:
- Create an expense with Bob at 300 kr of 500 kr bill; expense re-renders with drift-absorbed shares, balances reflect this.
- Edit loads override values, save round-trips.

### Phase 5 — Validation, summary strip, polish

Scope:
- Summary strip text under the split list.
- Inline errors + submit disabled for invalid states.
- Mode-switch preservation copy.
- Small UX cleanups discovered during manual phases above.

Verify:
- Percent > 100 → error + submit disabled.
- Fixed amounts > total → error + submit disabled.
- Valid form → summary reads correctly for "some overrides" and "all overrides".
- End-to-end on a real group + real settlement.

---

## Verification (cross-phase)

1. `npm run check:fix` (Biome) lint clean after each phase.
2. `npm test` full suite green after each phase.
3. Manual iOS/Safari check: focus the override input → no viewport zoom.
4. Apply migration locally, create + edit expenses with overrides, verify balance summary.
5. Legacy expenses (`split_overrides === null`) still load, edit, and save correctly.

---

## Risks / open questions

- **Mixed % and amount on same expense**: out of scope — global toggle means one mode per expense. Workaround: user does math, enters as amount.
- **Mode-switch preservation**: keeping raw values across toggles may confuse users treating it as "reset". If it becomes an issue, clear overrides on toggle — cheap to change later.
- **Realtime subscription**: nullable column add doesn't break existing channels.
- **Future: round-robin rounding fairness**: current drift-to-payer is simpler but less fair than Splitwise's round-robin cent distribution. Revisit if complaints surface.
