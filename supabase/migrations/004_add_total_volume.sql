-- ═══════════════════════════════════════════════════════════════
-- Add total_volume_inr to partner_metrics
-- Stores aggregate trading volume in INR per partner
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE partner_metrics
ADD COLUMN IF NOT EXISTS total_volume_inr BIGINT NOT NULL DEFAULT 0;

