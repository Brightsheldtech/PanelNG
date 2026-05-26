-- Add wallet stats columns to users table
-- Run in Supabase SQL Editor
--
-- total_funded: cumulative amount ever deposited into this wallet
-- total_spent: cumulative amount ever debited from this wallet

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS total_funded NUMERIC(12, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS total_spent  NUMERIC(12, 2) DEFAULT 0.00;
