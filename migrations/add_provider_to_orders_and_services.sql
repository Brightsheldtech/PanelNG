-- Add provider column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'jap';

-- Add provider column to services table
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'jap';

-- Drop old single-column unique constraint on panel_service_id
ALTER TABLE public.services DROP CONSTRAINT IF EXISTS services_panel_service_id_key;

-- Add composite unique constraint so both panels can share numeric service IDs
ALTER TABLE public.services DROP CONSTRAINT IF EXISTS services_panel_service_id_provider_key;
ALTER TABLE public.services ADD CONSTRAINT services_panel_service_id_provider_key UNIQUE (panel_service_id, provider);
