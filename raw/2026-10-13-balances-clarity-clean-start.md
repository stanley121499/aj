# Balances clarity + clean start — context brief

**Date:** 2026-10-13  
**Repo:** `/Users/stanley/Documents/GIthub/aj`  
**Source plan:** `/Users/stanley/.cursor/plans/balances_clarity_ux_4d628606.plan.md`  
**Companion:** [Agent prompts](./2026-10-13-balances-clarity-agent-prompts.md) — paste those into implementation agents

---

## 1. Clean-start context

We wiped operational money data so operators can re-seed with clear opening balances and clearer UI copy. Treat the live DB as a **fresh ledger**.

### What was cleared / reset

| Area | State |
|------|--------|
| Transactions | Cleared |
| Notes | Cleared |
| Results | Cleared |
| Account / Baki balances | Zeroed |
| User × category pairs | Filled so every user has a balance row per category |
| Empty category | Removed |
| Baki feature | **Off by default** via `app_settings` key `baki_enabled` (`AppSettingsContext`) |

### Backup

- Folder: `backups/2026-10-13_1756/`
- Postgres schema: `backup_20261013_1756` (transactions, account_balances, bakis, notes, results)
- Restore: `backups/2026-10-13_1756/RESTORE.sql` (or ask an agent to restore)

Do not invent restore steps that mutate live data unless the user asks.

---

## 2. Math model (balance up / down — not who-owes-whom)

Each **user × category** balance is a **single signed number** (not a bank cash account).

### Engine (always the same)

- Transaction `amount` is stored as a **positive** number.
- Direction lives in `type`:
  - **Debit** → balance goes **up** (`+amount`)
  - **Credit** → balance goes **down** (`−amount`)
- Runtime truth: `AccountBalanceContext` / `BakiContext` / `src/utils/transactionUtils.ts` use `debit → +amount`, `credit → −amount`.

### Two entry rules (same digit, opposite effect)

| Input | Positive number means | Creates | Balance moves |
|-------|------------------------|---------|---------------|
| **Note** (payment slip) | Money **in** | Credit | **Down** |
| **Result** (game outcome) | Against the user | Debit | **Up** |

Code paths:

- Notes: `src/utils/noteUtils.ts` — `amount >= 0` → `"credit"`, else `"debit"`
- Results: `src/utils/transactionCreator.ts` — `amount > 0` → `"debit"`, else `"credit"`

**Do not unify** note vs result sign conventions in this initiative. Fix presentation and helpers only.

### UI language (required)

Use **balance up / balance down / above zero / below zero / zero**.

Do **not** use who-owes-whom, “boss owes”, “user owes”, or similar social-debt framing in product copy. Some older comments still use that language; new copy and docs should not.

---

## 3. Known bugs / landmines

1. **Orange always-debit** — `src/pages/orange/edit-user-modal.tsx` posts `type: "debit"` with `Math.abs(difference)` for both increases and decreases. Decreasing a balance currently moves the wrong way. Fix: signed delta (`delta >= 0` → debit, else credit). **Keep the name Orange** (nav, routes, page title).
2. **Inverted type docs** — `src/types/transaction.ts` `calculateBalanceChange` documents and implements the **opposite** of runtime (`credit → +`, `debit → −`). Align docs/helpers with runtime (`debit → +`, `credit → −`). Prefer a single shared helper (new `balanceLanguage` +/or fix `transactionUtils` / dead duplicate in `types/transaction.ts`).
3. **Reset Calculations** — Dashboard control on `src/pages/index.tsx` can duplicate note transactions. **Leave disabled / do not re-enable** until a redesign with dedupe exists.

---

## 4. Product decisions (locked)

| Decision | Choice |
|----------|--------|
| Orange naming | **Keep** “Orange”; only clarify helpers (e.g. list = below-zero users; Clear all clears negatives) |
| Clarity language | ↑ / ↓ on transaction effect + **Source** (NOTE / RESULT / OPENING / PAYOUT); legend for above/below/zero |
| Onboarding | By **use case / role**, not by jargon dump |
| Opening balances | Admin CSV that posts audit-friendly **`OPENING`** transactions (not silent UPDATEs); replace prior OPENING for same user×category |
| Baki | Gated by `AppSettingsContext` (`isBakiEnabled`); default off |
| Note vs result signs | Keep opposite conventions; teach them in UI |
| Reset Calculations | Stay off |

---

## 5. Use cases by role

Onboarding and copy should map 1:1 to these jobs.

### Customer

1. **Check my balance** — Per-category signed balances; understand above/below zero + colors.
2. **Submit a payment note** — Proof + amount; **+ = money in → balance down**.
3. **Review my history** — ↑/↓ + source (not debit/credit jargon).

### Employee / operator

4. **Approve or reject notes** — Confirm before balance moves; A → B preview.
5. **Enter results** — Paste `amount username`; **+ = balance up** (opposite of notes); parse preview.
6. **Look up a user** — Balances / activity; Account balance vs Baki when enabled.
7. **Orange adjustments** — Users with below-zero balances; correct signed math; Clear all helper text only.
8. **Manage categories** — Non-blank categories; each user gets a balance row per category.

### Admin

9. **Clean-start opening balances** — CSV import for all users × categories.
10. **Turn Baki on/off** — Global kill-switch.
11. **Create users / roles** — Balances auto-created per category.
12. **First-time orientation** — Role-based onboarding so note vs result signs stick.

---

## 6. Phased scope summary

### Phase A — Trust + money comprehension (now)

- Shared `balanceLanguage` helpers + legend
- Balance cards + transaction ↑/↓ + source
- Note/result helpers + result parse preview
- Humanize enums (`account_balance` → “Account balance”, category **names**)
- Fix Orange debit bug (keep name)
- Admin settings cleanup: real controls only (Baki + Opening balances CSV)
- Onboarding hub + role tracks + Help nav + soft first-login prompt

### Phase B — Operator safety + RBAC

- Route guards mirroring sidebar roles
- Confirm dialogs (approve note, edit/delete result) with balance impact
- Empty states vs loading
- Create-note admin `user_id` reset after submit (`create-note-form.tsx`)

### Phase C — Mobile + polish (follow-up)

- Search + account menu on small screens
- Dead bottom-nav routes
- Breadcrumbs / titles / amount formatting
- Later: prefer `numeric` money columns (float drift)

### Explicitly out of scope

- Unifying note vs result sign conventions
- Re-enabling Reset Calculations
- Full RLS rollout on all tables (separate security pass; `app_settings` already has RLS)

---

## 7. Key file map

| Area | Paths |
|------|--------|
| Baki gate | `src/context/AppSettingsContext.tsx` |
| Balance cards | `src/components/dashboard/balance-cards.tsx` |
| Notes → txs | `src/utils/noteUtils.ts`, `src/components/dashboard/create-note-form.tsx` |
| Results → txs | `src/utils/transactionCreator.ts`, `src/pages/results/add-result-modal.tsx` |
| Runtime balance math | `src/context/AccountBalanceContext.tsx`, `src/context/BakiContext.tsx`, `src/utils/transactionUtils.ts` |
| Inverted docs | `src/types/transaction.ts` |
| Orange | `src/pages/orange/edit-user-modal.tsx`, `src/pages/orange/list.tsx` |
| Transactions UI | `src/pages/transaction/list.tsx` |
| Settings | `src/pages/users/settings.tsx` |
| Routes / nav | `src/App.tsx`, `src/components/sidebar.tsx` |
| Dashboard / reset | `src/pages/index.tsx` |
| New util (planned) | `src/utils/balanceLanguage.ts` |
| Onboarding (planned) | `src/pages/onboarding/` |
| Types regen | `database.types.ts` (add `OPENING` to source enum if schema updates) |

---

## 8. Implementation prompts

For step-by-step agent jobs (self-contained, ordered, copy-paste ready), use:

**[`raw/2026-10-13-balances-clarity-agent-prompts.md`](./2026-10-13-balances-clarity-agent-prompts.md)**

Read this brief first; do not paste the entire plan into every agent — point agents here for shared background.
