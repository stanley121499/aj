-- Restore customer balances, transactions, notes & results from backup_20261013_1756
-- Taken before clear on 2026-10-13
-- Counts at backup: transactions=953, account_balances=560 (sum=516648), bakis=560, notes=229, results=128

BEGIN;

-- Clear current live data first (order respects FKs)
-- transactions.result_id -> results; notes may also reference results
DELETE FROM public.transactions;
DELETE FROM public.notes;
DELETE FROM public.results;
DELETE FROM public.account_balances;
DELETE FROM public.bakis;

-- Restore from backup schema
-- results before transactions (and after notes delete) so result_id FKs succeed
INSERT INTO public.account_balances
SELECT * FROM backup_20261013_1756.account_balances;

INSERT INTO public.bakis
SELECT * FROM backup_20261013_1756.bakis;

INSERT INTO public.results
SELECT * FROM backup_20261013_1756.results;

INSERT INTO public.notes
SELECT * FROM backup_20261013_1756.notes;

INSERT INTO public.transactions
SELECT * FROM backup_20261013_1756.transactions;

-- Optional: reset sequences if needed for transactions.id
SELECT setval(
  pg_get_serial_sequence('public.transactions', 'id'),
  COALESCE((SELECT MAX(id) FROM public.transactions), 1),
  true
);

COMMIT;

-- Verify after restore:
-- SELECT COUNT(*) FROM public.transactions;
-- SELECT COUNT(*), SUM(balance) FROM public.account_balances;
-- SELECT COUNT(*), SUM(balance) FROM public.bakis;
-- SELECT COUNT(*) FROM public.notes;
-- SELECT COUNT(*) FROM public.results;
