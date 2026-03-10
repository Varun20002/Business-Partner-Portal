-- ═══════════════════════════════════════════════════════════════
-- Add name and rsr_percentage to partner_metrics
-- These fields come from Google Sheets import
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE partner_metrics
ADD COLUMN IF NOT EXISTS name VARCHAR(255) DEFAULT '',
ADD COLUMN IF NOT EXISTS rsr_percentage DECIMAL(5,2) DEFAULT 20.00;

-- Index for faster name lookups (optional)
CREATE INDEX IF NOT EXISTS idx_partner_metrics_name ON partner_metrics(name) WHERE name != '';
