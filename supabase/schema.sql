-- PanelNG Database Schema
-- Run this in your Supabase SQL Editor (https://app.supabase.com → SQL Editor)

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name   TEXT NOT NULL,
  wallet_balance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
  role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);

-- ============================================================
-- SERVICES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.services (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  platform         TEXT NOT NULL,
  name             TEXT NOT NULL,
  panel_service_id TEXT UNIQUE NOT NULL,
  cost_price       NUMERIC(12, 4) NOT NULL DEFAULT 0,
  sell_price       NUMERIC(12, 4) NOT NULL DEFAULT 0,
  min_quantity     INTEGER NOT NULL DEFAULT 10,
  max_quantity     INTEGER NOT NULL DEFAULT 100000,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS services_platform_idx ON public.services(platform);
CREATE INDEX IF NOT EXISTS services_active_idx ON public.services(is_active);

-- ============================================================
-- ORDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type           TEXT NOT NULL CHECK (type IN ('smm', 'sms')),
  platform       TEXT,
  service_name   TEXT,
  quantity       INTEGER,
  link           TEXT,
  amount_paid    NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'pending',
  panel_order_id TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS orders_user_idx ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders(status);
CREATE INDEX IF NOT EXISTS orders_created_idx ON public.orders(created_at DESC);

-- ============================================================
-- TRANSACTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  amount      NUMERIC(12, 2) NOT NULL,
  reference   TEXT,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS transactions_user_idx ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS transactions_ref_idx ON public.transactions(reference);
CREATE INDEX IF NOT EXISTS transactions_created_idx ON public.transactions(created_at DESC);

-- ============================================================
-- SMS_ORDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sms_orders (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform     TEXT NOT NULL,
  phone_number TEXT,
  order_id     TEXT,
  status       TEXT NOT NULL DEFAULT 'pending',
  amount_paid  NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sms_orders_user_idx ON public.sms_orders(user_id);
CREATE INDEX IF NOT EXISTS sms_orders_order_idx ON public.sms_orders(order_id);

-- ============================================================
-- BANK_DETAILS TABLE  (admin-managed bank accounts for manual deposits)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bank_details (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_name      TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name   TEXT NOT NULL,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PAYMENT_REQUESTS TABLE  (manual bank deposit confirmations)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payment_requests (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount        NUMERIC(12, 2) NOT NULL,
  reference     TEXT UNIQUE NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  reject_reason TEXT,
  confirmed_at  TIMESTAMPTZ,
  confirmed_by  UUID REFERENCES public.users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payment_requests_user_idx   ON public.payment_requests(user_id);
CREATE INDEX IF NOT EXISTS payment_requests_status_idx ON public.payment_requests(status);
CREATE INDEX IF NOT EXISTS payment_requests_ref_idx    ON public.payment_requests(reference);

-- ============================================================
-- APP_SETTINGS TABLE  (key-value store for runtime config)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.app_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default settings (safe to re-run — ON CONFLICT DO NOTHING)
INSERT INTO public.app_settings (key, value) VALUES
  ('admin_email', 'adedayoadedoyin245@gmail.com'),
  ('gmail_user',  'adedayoadedoyin245@gmail.com')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- ROW LEVEL SECURITY — DISABLE (we use service role key on backend)
-- ============================================================
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_details DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- SEED: Create your first admin account
-- Run this AFTER registering via the app, then update the role
-- ============================================================
-- UPDATE public.users SET role = 'admin' WHERE email = 'your@email.com';

-- ============================================================
-- SAMPLE SERVICES (optional — or use Admin → Sync from JAP)
-- ============================================================
INSERT INTO public.services (platform, name, panel_service_id, cost_price, sell_price, min_quantity, max_quantity, is_active)
VALUES
  ('Instagram', 'Instagram Followers [HQ]', '1001', 50.00, 75.00, 100, 50000, true),
  ('Instagram', 'Instagram Likes [Fast]',   '1002', 10.00, 18.00, 50, 10000, true),
  ('TikTok',    'TikTok Followers',          '2001', 40.00, 65.00, 100, 100000, true),
  ('TikTok',    'TikTok Views [Real]',       '2002', 5.00,  9.00,  500, 500000, true),
  ('YouTube',   'YouTube Views',             '3001', 15.00, 25.00, 500, 50000, true),
  ('Twitter',   'Twitter/X Followers',       '4001', 60.00, 95.00, 100, 25000, true),
  ('Facebook',  'Facebook Page Likes',       '5001', 35.00, 55.00, 100, 10000, true),
  ('Telegram',  'Telegram Channel Members',  '6001', 45.00, 70.00, 100, 50000, true)
ON CONFLICT (panel_service_id) DO NOTHING;
