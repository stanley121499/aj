# Backup 2026-10-13_1756

Taken before clearing customer balances, transactions, notes, and results.

## What's backed up

| Table | Rows | Notes |
|-------|------|--------|
| `transactions` | 953 | Full row copy |
| `account_balances` | 560 | Sum of balances was 516648 |
| `bakis` | 560 | Sum of balances was 0 |
| `notes` | 229 | Cleared later; full row copy |
| `results` | 128 | Cleared later; full row copy (were PENDING) |

## Where the data lives

Postgres schema: `backup_20261013_1756`

- `backup_20261013_1756.transactions`
- `backup_20261013_1756.account_balances`
- `backup_20261013_1756.bakis`
- `backup_20261013_1756.notes`
- `backup_20261013_1756.results`

## How to restore

Run `RESTORE.sql` against the Supabase project (SQL editor or MCP `execute_sql`).

Or ask the agent: "restore the 2026-10-13_1756 backup".
