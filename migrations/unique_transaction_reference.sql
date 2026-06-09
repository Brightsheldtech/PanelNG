-- Prevent duplicate wallet credits from double webhook / double verify calls.
-- This is a partial unique index: only enforces uniqueness where reference IS NOT NULL.
-- Run once in Supabase SQL editor.
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_reference
  ON public.transactions(reference)
  WHERE reference IS NOT NULL;
