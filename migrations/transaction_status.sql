-- Add status column to transactions table for referral pending tracking
-- Run in Supabase SQL Editor

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'success';

-- Backfill: any referral transactions already inserted with -PENDING suffix
-- should be marked pending (in case they were inserted before this migration)
UPDATE public.transactions
SET status = 'pending'
WHERE reference LIKE '%-PENDING'
  AND status = 'success';
