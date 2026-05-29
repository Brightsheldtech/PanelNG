-- Part 1: manual price override on SMM services (JAP + SMMRaja)
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS manual_price NUMERIC;

-- Part 2: manual price override on SMS country settings (HeroSMS)
ALTER TABLE public.sms_country_settings ADD COLUMN IF NOT EXISTS manual_price_ngn NUMERIC;
