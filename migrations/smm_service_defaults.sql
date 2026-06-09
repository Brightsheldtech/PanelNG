-- Set is_active column default to false for new services inserted via sync
ALTER TABLE public.services ALTER COLUMN is_active SET DEFAULT false;

-- Deactivate all existing services — admin must explicitly activate services to make them visible
-- WARNING: Run this once intentionally; it will hide all SMM services from customers until re-activated
UPDATE public.services SET is_active = false;
