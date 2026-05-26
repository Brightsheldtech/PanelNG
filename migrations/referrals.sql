-- Referrals table
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  referee_id  UUID REFERENCES public.users(id) ON DELETE CASCADE,
  bonus_paid  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (referrer_id, referee_id)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own referrals"
ON public.referrals FOR SELECT TO authenticated
USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

-- Index for fast referrer lookups
CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON public.referrals (referrer_id);
