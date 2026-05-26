-- Wallet adjustments audit log for admin manual balance changes
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.wallet_adjustments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.users(id) ON DELETE CASCADE,
  admin_id   UUID REFERENCES public.users(id),
  type       TEXT CHECK (type IN ('add', 'deduct')),
  amount     NUMERIC(12, 2),
  reason     TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.wallet_adjustments DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS wallet_adjustments_user_idx  ON public.wallet_adjustments (user_id);
CREATE INDEX IF NOT EXISTS wallet_adjustments_admin_idx ON public.wallet_adjustments (admin_id);
CREATE INDEX IF NOT EXISTS wallet_adjustments_date_idx  ON public.wallet_adjustments (created_at DESC);

-- To make the first user an admin, run this after they register:
-- UPDATE public.users SET role = 'admin' WHERE email = 'your-email@example.com';
