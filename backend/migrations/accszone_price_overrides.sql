-- Run this in Supabase SQL editor
CREATE TABLE IF NOT EXISTS accszone_price_overrides (
  slug TEXT PRIMARY KEY,
  title TEXT,
  custom_price_ngn NUMERIC NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE accszone_price_overrides ENABLE ROW LEVEL SECURITY;

-- Service role (backend) has full access; no direct client access needed
CREATE POLICY "Service role full access" ON accszone_price_overrides
  FOR ALL USING (true) WITH CHECK (true);
