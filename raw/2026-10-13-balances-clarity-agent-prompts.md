# Balances clarity — implementation agent prompts

**Date:** 2026-10-13  
**Workspace:** `/Users/stanley/Documents/GIthub/aj`  
**Shared background (read first):** [`raw/2026-10-13-balances-clarity-clean-start.md`](./2026-10-13-balances-clarity-clean-start.md)  
**Full plan (optional):** `/Users/stanley/.cursor/plans/balances_clarity_ux_4d628606.plan.md`

Paste **one** fenced prompt block per agent session. Run **in order**. Each agent may explore the repo; they should not need chat history.

---

## Global constraints (baked into every prompt)

- Double quotes for strings; no `any`; no non-null assertion (`!`); no `as unknown as T`
- Do **not** rename Orange
- Do **not** use who-owes-whom / boss-owe copy — balance up/down / above-below zero only
- Do **not** unify note vs result sign conventions
- Do **not** re-enable Reset Calculations
- Do **not** commit unless asked
- Preserve Flowbite patterns; gate Baki via `AppSettingsContext`
- Match existing code style; JSDoc on new exported helpers

---

## TOC — agent jobs

| # | Focus | Depends on |
|---|--------|------------|
| 1 | `balanceLanguage` util + types/docs alignment + Orange debit bug | — |
| 2 | UI clarity: legend, transactions ↑/↓, note/result helpers, humanize | Agent 1 |
| 3 | Admin settings cleanup + Opening balances CSV | Agent 1 |
| 4 | Onboarding hub + Help nav + soft first-login prompt | Agents 1–2 |
| 5 | Phase B: RBAC, confirms, empty states, create-note `user_id` | Agents 1–2 (3–4 OK in parallel after 1–2) |
| 6 | Phase C mobile/polish — **follow-up only** | Agents 1–5 |

---

## Agent 1 — Shared language util, docs, Orange bug

```
You are implementing Agent 1 of the Balances Clarity initiative in workspace:

  /Users/stanley/Documents/GIthub/aj

Read shared background first (do not reinvent product decisions):
  raw/2026-10-13-balances-clarity-clean-start.md

Optional deeper plan:
  /Users/stanley/.cursor/plans/balances_clarity_ux_4d628606.plan.md

## Goal

1. Add a small shared util for balance presentation + signed-delta helpers.
2. Align type comments / dead helpers with runtime math.
3. Fix the Orange edit-balance bug that always posts debit.

## Runtime math (source of truth)

- Debit → balance goes UP (+amount)
- Credit → balance goes DOWN (−amount)
- Amount stored positive; direction in type
- Runtime: src/context/AccountBalanceContext.tsx, src/context/BakiContext.tsx, src/utils/transactionUtils.ts
- Notes (positive amount → credit → balance down): src/utils/noteUtils.ts
- Results (positive amount → debit → balance up): src/utils/transactionCreator.ts
- Do NOT change note/result sign conventions — only fix wrong docs and Orange posting

## Constraints (must follow)

- Workspace: /Users/stanley/Documents/GIthub/aj
- Double quotes for strings; no any; no !; no "as unknown as T"
- Do NOT rename Orange (nav label, routes /orange, page titles stay "Orange")
- Do NOT use who-owes-whom / boss-owe copy in new user-facing strings or new comments — use balance up/down / above zero / below zero / zero
- Do NOT unify note vs result sign conventions
- Do NOT re-enable Reset Calculations on src/pages/index.tsx
- Do NOT commit unless asked
- Preserve Flowbite patterns; Baki gated via AppSettingsContext
- Match existing code style; JSDoc on new exports

## Key files

- NEW: src/utils/balanceLanguage.ts
- Fix docs/impl drift: src/types/transaction.ts (calculateBalanceChange currently inverted vs runtime)
- Prefer single math helper: either fix types/transaction.ts to re-export from transactionUtils, or make types helper match transactionUtils and stop duplicating wrong formula
- Orange bug: src/pages/orange/edit-user-modal.tsx (always type: "debit" + Math.abs(difference))
- Orange list helper copy only: src/pages/orange/list.tsx
- Baki gate reference: src/context/AppSettingsContext.tsx

## Implement

### A. src/utils/balanceLanguage.ts

Export helpers such as (names may vary; keep them focused and typed):

- formatSignedBalance / direction labels: "Above 0", "Below 0", "Zero" (or equivalent short labels)
- short tip strings for note entry vs result entry (positive → down for notes; positive → up for results)
- arrowEffectLabel(type, amount) → "↑ $X" / "↓ $X" based on runtime: debit=up, credit=down
- signedDeltaToTransactionType(delta): delta >= 0 → "debit", else "credit"; amount = Math.abs(delta)
- humanizeTarget("account_balance" | "baki") → "Account balance" | "Baki"
- humanizeSource for NOTE / RESULT / PAYOUT / OPENING (OPENING may not exist in types yet — support the string in the util; schema enum can land in Agent 3)
- previewBalanceChange(current, deltaOrType+amount) → "A → B" string using runtime math

No React in this util. No who-owes copy.

### B. Align types / docs

- Fix src/types/transaction.ts comments and calculateBalanceChange so they match runtime (debit +, credit −), OR deprecate/redirect to src/utils/transactionUtils.ts calculateBalanceChange
- Update misleading comments in noteUtils / transactionUtils that say "boss owes" to balance up/down language if you touch those lines — do not change the actual credit/debit mapping for notes/results

### C. Fix Orange edit-user-modal

- When setting absolute balances, compute difference = new − initial
- Post transaction with amount Math.abs(difference) and type from signedDeltaToTransactionType(difference)
- Apply for account_balance always; for baki only when isBakiEnabled
- Keep source as PAYOUT unless product already has a better existing source for manual adjustments — do not invent a rename of Orange
- Clarify Clear-all helper text on list if needed (clears negatives only) — keep name Orange

## Acceptance criteria

- [ ] balanceLanguage.ts exists, typed strictly, JSDoc on exports
- [ ] No inverted debit/credit formula left in types/transaction.ts relative to AccountBalanceContext
- [ ] Orange decrease (new < old) creates a credit; increase creates a debit
- [ ] Orange still named Orange everywhere in UI
- [ ] No who-owes-whom in new UI strings
- [ ] Typecheck / project still builds; no commit

## What NOT to do

- Do not rewrite balance cards, transaction list, onboarding, or CSV import (later agents)
- Do not flip noteUtils / transactionCreator sign rules
- Do not enable Reset Calculations
- Do not add OPENING schema migration unless required for types compile of this agent’s work (prefer Agent 3)

## Handoff for Agent 2

- Document exported function names from balanceLanguage.ts
- Confirm Orange fix behavior with one short example (e.g. 100 → 40 posts credit 60)
- List any remaining files that still display raw Debit/Credit or bare green/red without legend
```

---

## Agent 2 — UI clarity (cards, ledger, note/result helpers)

```
You are implementing Agent 2 of the Balances Clarity initiative in workspace:

  /Users/stanley/Documents/GIthub/aj

Read:
  raw/2026-10-13-balances-clarity-clean-start.md

Prerequisite: Agent 1 should have landed src/utils/balanceLanguage.ts and fixed Orange math.
If balanceLanguage.ts is missing, implement the minimal helpers you need there first (same rules as Agent 1), then continue.

## Goal

Make money movement understandable in the live UI without who-owes language:

1. Balance cards legend (above / below / zero) + consistent color pairing with labels
2. Transaction list: ↑/↓ effect + Source; hide Debit/Credit for customers; admins may see muted secondary debit/credit
3. Create-note helper + live A → B preview
4. Add-result helper + same-digit contrast vs notes + parse preview before save
5. Humanize targets / category names / sources in notes, results, transactions lists

## Constraints (must follow)

- Workspace: /Users/stanley/Documents/GIthub/aj
- Double quotes for strings; no any; no !; no "as unknown as T"
- Do NOT rename Orange
- Do NOT use who-owes-whom / boss-owe copy — balance up/down / above-below zero
- Do NOT unify note vs result sign conventions
- Do NOT re-enable Reset Calculations
- Do NOT commit unless asked
- Preserve Flowbite patterns; Baki via AppSettingsContext (hide Baki cards/UI when off)
- Reuse balanceLanguage helpers — do not hardcode divergent copy
- Match existing code style

## Key files

- src/utils/balanceLanguage.ts (from Agent 1)
- src/components/dashboard/balance-cards.tsx
- src/pages/transaction/list.tsx
- src/components/dashboard/create-note-form.tsx
- src/pages/results/add-result-modal.tsx
- Related list UIs under src/pages/notes/, src/pages/results/ as needed for humanization
- Auth/role: use existing AuthContext / user_detail patterns to know customer vs admin

## Math reminders for copy only

- Note +amount → credit → balance DOWN
- Result +amount → debit → balance UP
- Side-by-side example in result helper: "$100 note → balance ↓; $100 result → balance ↑"

## Implement

### Balance cards

- Keep signed $ amounts
- Add compact legend: Above 0 / Below 0 / Zero (or balanceLanguage labels)
- One-line tip linking to Help/onboarding if route exists; if /onboarding not yet present, link to a plausible Help href (/onboarding) or omit until Agent 4 — prefer linking to /onboarding
- Do not imply green = "good"; green/red only with labeled meaning above/below zero

### Transactions

- Primary display: ↑ $X / ↓ $X from type (debit up, credit down) + Source badge
- Customers: no Debit/Credit badges
- Admins/operators: optional muted Debit/Credit secondary text
- Humanize category name and target

### Create note

- Helper: Positive = money in → balance down; Negative = money out → balance up
- Live preview: Balance will go from A → B (need current balance for selected user/category — explore existing contexts)

### Add result

- Helper: Positive = balance up; Negative = balance down
- Contrast callout vs notes
- Format hint: amount username
- Parse preview of rows before save (reuse existing resultParser if present)

### Humanize

- Never show raw account_balance / category ids / cryptic enums in user-visible cells when a name exists

## Acceptance criteria

- [ ] Dashboard balances have a readable legend
- [ ] Transaction rows show ↑/↓ + source for normal viewing
- [ ] Note and result forms teach opposite + effects with preview
- [ ] No who-owes copy introduced
- [ ] Baki still hidden when AppSettings says off
- [ ] Builds; no commit

## What NOT to do

- Do not build CSV opening import or settings strip (Agent 3)
- Do not build full onboarding hub (Agent 4) — linking to /onboarding is OK
- Do not add route RBAC (Agent 5)
- Do not change Orange posting logic unless broken after Agent 1

## Handoff for Agent 3 / 4

- List components that import balanceLanguage
- Note any gaps (e.g. OPENING source not in DB enum yet)
- Confirm Help link target used on legend tip
```

---

## Agent 3 — Admin settings + Opening balances CSV

```
You are implementing Agent 3 of the Balances Clarity initiative in workspace:

  /Users/stanley/Documents/GIthub/aj

Read:
  raw/2026-10-13-balances-clarity-clean-start.md

Prerequisite: Agent 1 balanceLanguage signed-delta helpers. Prefer Agent 2 UI language already in place, but you can ship CSV without Agent 2.

## Goal

1. Clean admin settings: remove/gate Flowbite demo chrome; keep real controls only.
2. Baki kill-switch already exists via AppSettingsContext — wire/expose it cleanly if not already the primary control.
3. Admin CSV "Set opening balances" that posts OPENING transactions with preview + replace semantics.

## Constraints (must follow)

- Workspace: /Users/stanley/Documents/GIthub/aj
- Double quotes for strings; no any; no !; no "as unknown as T"
- Do NOT rename Orange
- Do NOT use who-owes-whom / boss-owe copy — balance up/down / above-below zero
- Do NOT unify note vs result sign conventions
- Do NOT re-enable Reset Calculations
- Do NOT commit unless asked
- Preserve Flowbite patterns; Baki gated via AppSettingsContext
- Opening balances: audit-friendly OPENING txs via existing TransactionContext.addTransaction — NOT silent UPDATEs of balance rows alone
- Admin-only for CSV and Baki toggle (mirror existing admin checks / RLS expectations)
- Match existing code style

## Key files

- src/pages/users/settings.tsx
- src/context/AppSettingsContext.tsx (BAKI_ENABLED_SETTING_KEY, setBakiEnabled)
- src/context/TransactionContext.tsx (addTransaction)
- src/utils/balanceLanguage.ts (signedDeltaToTransactionType / previews)
- src/types/transaction.ts / database.types.ts — extend source to include OPENING if schema allows
- NEW: admin opening-balances section/component (under settings or users admin) e.g. src/pages/users/opening-balances.tsx or similar colocated module
- Supabase: if transaction source is a Postgres enum, add OPENING via migration (use Supabase MCP/skill if available; otherwise document SQL for the user)

## Opening CSV behavior

Flow:
1. Download CSV template
2. Operator fills: username, category, balance (signed target: + = above zero)
3. Upload → preview diffs: current → target, row count, net change
4. Confirm → for each row:
   - Reverse/neutralize prior transactions with source OPENING for that user×category (replace semantics — idempotent re-import)
   - Insert new OPENING tx(s) via addTransaction so balances match targets
5. While Baki is off: account_balance only. If Baki enabled, allow optional baki column or separate target — keep UX simple; do not force Baki columns when feature is off.

Signed posting: delta = target − current; use Agent 1 helper (delta >= 0 → debit, else credit).

## Settings cleanup

- Strip or clearly gate Flowbite demo / placeholder content on settings page
- Visible admin controls: Baki on/off + Opening balances entry
- Language: "Above 0 / Below 0", not owe framing

## Acceptance criteria

- [ ] Settings page is usable for admins without demo clutter dominating
- [ ] Baki toggle works through AppSettingsContext and fails closed (off) on load errors
- [ ] CSV template download + preview + confirm exist
- [ ] Re-import replaces prior OPENING for same user×category rather than stacking blindly
- [ ] Balances end at CSV targets after confirm
- [ ] OPENING appears as source in types/UI humanization where applicable
- [ ] Builds; no commit

## What NOT to do

- Do not silently UPDATE account_balances without ledger txs
- Do not open CSV to non-admins
- Do not build onboarding (Agent 4) or RBAC beyond admin checks needed here
- Do not rename Orange

## Handoff for Agent 4

- Path to opening balances UI and required columns
- Whether OPENING enum migration was applied
- Any follow-ups (Baki column when enabled)
```

---

## Agent 4 — Onboarding hub + Help + soft first-login prompt

```
You are implementing Agent 4 of the Balances Clarity initiative in workspace:

  /Users/stanley/Documents/GIthub/aj

Read:
  raw/2026-10-13-balances-clarity-clean-start.md
  Especially sections: Use cases by role, Phased scope Phase A onboarding

Prerequisite: Agent 1 balanceLanguage (reuse copy). Agent 2 helpers preferred so onboarding matches live UI.

## Goal

Ship a guided Help / Get started experience mapped to real use cases:

1. Route /onboarding (hub → role tracks → short steps)
2. Sidebar/nav Help link
3. Soft first-login prompt when onboarding incomplete (dismissible; never hard-block work)
4. Persist completion (user_details onboarding_completed_at or small user_settings flag — explore schema; prefer minimal migration)

## Constraints (must follow)

- Workspace: /Users/stanley/Documents/GIthub/aj
- Double quotes for strings; no any; no !; no "as unknown as T"
- Do NOT rename Orange
- Do NOT use who-owes-whom / boss-owe copy — balance up/down / above-below zero
- Do NOT unify note vs result sign conventions
- Do NOT re-enable Reset Calculations
- Do NOT commit unless asked
- Preserve Flowbite patterns; one job per step; short copy; reuse balanceLanguage strings so onboarding never drifts from UI
- Baki mentions only when relevant; respect AppSettingsContext
- Match existing code style

## Key files

- NEW: src/pages/onboarding/ (hub + step views)
- src/App.tsx — add protected route /onboarding
- src/components/sidebar.tsx — Help link
- Auth: src/context/AuthContext.tsx / user_detail role fields
- Optional: soft prompt on src/pages/index.tsx dashboard
- Copy source: src/utils/balanceLanguage.ts

## Structure

### Hub

"What do you want to do?" filtered by role:

- Customer: use cases 1–3 (check balance, submit note, review history)
- Employee: 4–8 (+ customer track for empathy)
- Admin: everything, highlight Clean start (opening CSV, Baki, users/categories)

### Each use case step sequence (3–6 screens max per track)

Per step:

- One goal sentence
- One tip / annotated UI guidance (screenshot optional; text tip OK)
- The one math rule that matters (if any)
- Primary CTA deep link into real page (/dashboard, create-note, /notes, /results, /orange, settings opening CSV, /users/settings, /categories, /transactions)

### Shared “How balances work” mini-module (required once for employees/admins)

- Signed balance = running total above/below zero — no owe framing
- Note + vs Result + contrast (side-by-side $100)
- Optional one-question check: “Note +50 → does balance go up or down?”

### UX

- Progress checklist; Mark done + Skip for now
- Re-openable anytime from Help
- Soft prompt once after sign-in if incomplete; dismissible

## Acceptance criteria

- [ ] /onboarding reachable for signed-in users
- [ ] Help appears in sidebar
- [ ] Role filtering works for at least customer / employee / admin tracks
- [ ] Deep links land on real routes
- [ ] Math copy matches balanceLanguage (note down / result up)
- [ ] Soft prompt does not block dashboard work
- [ ] Completion persists across reload
- [ ] Builds; no commit

## What NOT to do

- Do not implement Phase B RBAC or Phase C mobile polish
- Do not change ledger math
- Do not invent who-owes metaphors to “make it clearer”
- Do not hard-gate the app behind onboarding

## Handoff for Agent 5

- Persistence column/key used for onboarding completion
- List of deep-link targets
- Any routes still missing that onboarding links to
```

---

## Agent 5 — Phase B: RBAC, confirms, empty states, create-note fix

```
You are implementing Agent 5 (UX Phase B) of the Balances Clarity initiative in workspace:

  /Users/stanley/Documents/GIthub/aj

Read:
  raw/2026-10-13-balances-clarity-clean-start.md
  Phase B section

Prerequisites: Agents 1–2 preferred (language + forms). Agents 3–4 may be parallel already; do not break their routes.

## Goal

Operator safety and RBAC hardening:

1. Role guards on routes (mirror sidebar visibility; customers blocked from staff pages)
2. Confirm dialogs for approve note and edit/delete result (warn about balance impact using up/down language)
3. Empty states vs loading on notes/users (and similar) — empty must not look like infinite loading
4. Fix create-note admin reset of user_id after submit in create-note-form.tsx

## Constraints (must follow)

- Workspace: /Users/stanley/Documents/GIthub/aj
- Double quotes for strings; no any; no !; no "as unknown as T"
- Do NOT rename Orange
- Do NOT use who-owes-whom / boss-owe copy — balance up/down / above-below zero
- Do NOT unify note vs result sign conventions
- Do NOT re-enable Reset Calculations
- Do NOT commit unless asked
- Preserve Flowbite patterns (Modal confirms OK)
- Baki gated via AppSettingsContext
- Match existing code style

## Key files

- src/App.tsx, src/components/ProtectedRoute.tsx, src/components/sidebar.tsx (role visibility mirror)
- Notes approve flow under src/pages/notes/ (explore)
- Results edit/delete under src/pages/results/
- src/components/dashboard/create-note-form.tsx (after submit, admin user_id incorrectly resets — fix so selection/default stays correct)
- List pages that show LoadingPage when arrays are empty

## Implement guidance

- Reuse existing role fields on user_detail; do not invent a parallel permission system
- Customers: dashboard, their notes creation, their transactions — not /notes moderation, /users, /categories, /orange, /results admin tools, settings admin (mirror whatever sidebar already hides)
- Confirm copy: “Balance will go from A → B” / “balance will go up/down” — never owe language
- Empty state: short message + optional CTA; loading only while fetch in flight

## Acceptance criteria

- [ ] Direct URL to staff routes redirects or blocks customers consistently with nav
- [ ] Approve note requires confirm with balance impact when applicable
- [ ] Result edit/delete confirms with balance impact warning
- [ ] Empty notes/users (and fixed peers) show empty UI, not perpetual loading
- [ ] Admin create-note no longer loses the intended user_id after successful submit
- [ ] Builds; no commit

## What NOT to do

- Do not start Phase C mobile work unless trivial one-liners fall out of RBAC
- Do not expand full RLS / security audit
- Do not re-enable Reset Calculations
- Do not rename Orange

## Handoff

- Document which roles can access which routes
- Note any pages still missing empty states
- Call out anything deferred to Phase C
```

---

## Agent 6 — Phase C mobile/polish (follow-up)

```
You are implementing OPTIONAL Agent 6 (UX Phase C) of the Balances Clarity initiative in workspace:

  /Users/stanley/Documents/GIthub/aj

Only run this after Agents 1–5 are substantially done. If context is tight, treat this as a checklist PR later rather than forcing all items.

Read:
  raw/2026-10-13-balances-clarity-clean-start.md
  Phase C section

## Goal (pick high-value items; do not bloat)

1. Show search + account menu on small screens if currently hidden
2. Fix or remove dead bottom-nav routes
3. Consistent breadcrumbs/titles (e.g. “All Notes”) and amount formatting (toLocaleString / 2 decimal places) using shared helpers where sensible
4. Do NOT do schema migration to numeric money columns unless explicitly asked — note as follow-up only

## Constraints (must follow)

- Workspace: /Users/stanley/Documents/GIthub/aj
- Double quotes for strings; no any; no !; no "as unknown as T"
- Do NOT rename Orange
- Do NOT use who-owes-whom / boss-owe copy
- Do NOT unify note vs result sign conventions
- Do NOT re-enable Reset Calculations
- Do NOT commit unless asked
- Preserve Flowbite patterns; Baki via AppSettingsContext
- Match existing code style

## Key areas to explore

- Layout / navbar / bottom nav components under src/components/
- List page titles across notes, transactions, results, users, orange
- Money display sites — prefer balanceLanguage or a tiny formatMoney helper

## Acceptance criteria

- [ ] Mobile users can reach search/account without dead ends (or documented remaining gaps)
- [ ] No clickable bottom-nav items pointing at missing routes
- [ ] Amounts/titles more consistent on touched pages
- [ ] Builds; no commit

## What NOT to do

- Do not reopen Phase A math language decisions
- Do not migrate float columns to numeric without an explicit schema task
- Do not large-refactor unrelated Flowbite demo pages

## Handoff

- Short leftover polish list for a future PR
```

---

## Suggested run order

```text
Agent 1 → Agent 2 ─┬→ Agent 4
                   └→ Agent 3 (can parallel Agent 2 after Agent 1)
Then Agent 5
Then Agent 6 (optional)
```

After each agent: skim diff, run the app smoke path for that slice, then paste the next prompt.
