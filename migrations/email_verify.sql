-- Email verification and account status for users
-- Run in Supabase SQL Editor
--
-- NOTE: email_verified defaults to TRUE so all existing users remain accessible.
-- New registrations set email_verified = FALSE explicitly in the backend.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS email_verification_token TEXT,
  ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMPTZ;

-- Fast token lookup
CREATE INDEX IF NOT EXISTS users_email_verification_token_idx
  ON public.users (email_verification_token)
  WHERE email_verification_token IS NOT NULL;

-- Fast status filter
CREATE INDEX IF NOT EXISTS users_status_idx ON public.users (status);
