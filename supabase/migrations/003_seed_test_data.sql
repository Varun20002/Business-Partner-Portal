-- ═══════════════════════════════════════════════════════════════
-- Seed Test Data for Partner Dashboard
-- This migration inserts realistic test metrics for existing partners
-- Also adds unique constraint on partner_uid for upsert operations
-- ═══════════════════════════════════════════════════════════════

-- Add unique constraint on partner_uid if it doesn't exist
-- This is required for upsert operations in the API
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'partner_metrics_partner_uid_key'
  ) THEN
    ALTER TABLE partner_metrics 
    ADD CONSTRAINT partner_metrics_partner_uid_key UNIQUE (partner_uid);
  END IF;
END $$;

-- Insert test metrics for existing partner
-- Replace 'VA51243378' with your actual partner UID if different
-- This uses UPSERT to allow re-running safely

INSERT INTO partner_metrics (
  partner_uid,
  total_users,
  traded_users,
  eligible_500_users,
  volume_eligible_users,
  total_volume_inr,
  updated_at
)
VALUES (
  'VA51243378',  -- Replace with your actual partner UID
  1250,          -- Total Users
  450,           -- Traded Users
  120,           -- Eligible 500 Users
  280,           -- Volume Eligible Users
  50000000,      -- Total Volume (INR)
  NOW()          -- Updated timestamp
)
ON CONFLICT (partner_uid) DO UPDATE SET
  total_users = EXCLUDED.total_users,
  traded_users = EXCLUDED.traded_users,
  eligible_500_users = EXCLUDED.eligible_500_users,
  volume_eligible_users = EXCLUDED.volume_eligible_users,
  total_volume_inr = EXCLUDED.total_volume_inr,
  updated_at = EXCLUDED.updated_at;

-- Optional: Insert additional test partners (uncomment if needed)
-- Make sure these UIDs exist in the profiles table first!

/*
INSERT INTO partner_metrics (
  partner_uid,
  total_users,
  traded_users,
  eligible_500_users,
  volume_eligible_users,
  total_volume_inr,
  updated_at
)
VALUES
  ('VB12345678', 890, 320, 85, 195, 30000000, NOW()),
  ('VC98765432', 2100, 750, 180, 420, 75000000, NOW()),
  ('VD55555555', 450, 150, 35, 90, 15000000, NOW())
ON CONFLICT (partner_uid) DO UPDATE SET
  total_users = EXCLUDED.total_users,
  traded_users = EXCLUDED.traded_users,
  eligible_500_users = EXCLUDED.eligible_500_users,
  volume_eligible_users = EXCLUDED.volume_eligible_users,
  total_volume_inr = EXCLUDED.total_volume_inr,
  updated_at = EXCLUDED.updated_at;
*/

