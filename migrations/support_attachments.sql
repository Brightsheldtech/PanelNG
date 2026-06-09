-- Add attachment support to support messages
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;
