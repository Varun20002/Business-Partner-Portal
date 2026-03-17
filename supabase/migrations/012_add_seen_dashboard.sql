-- Add seen_dashboard flag to profiles so the "New" badge on Resources
-- is only shown once per user across all devices.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS seen_dashboard boolean DEFAULT FALSE;
