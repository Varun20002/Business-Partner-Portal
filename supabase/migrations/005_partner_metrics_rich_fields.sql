-- ═══════════════════════════════════════════════════════════════
-- Extend partner_metrics with richer performance fields
-- These support the new dashboard breakdown sourced from Google Sheets
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE partner_metrics
ADD COLUMN IF NOT EXISTS new_users INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS crossed_threshold_users INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS new_user_incentive_inr BIGINT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_baseline_volume_inr BIGINT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS incremental_volume_inr BIGINT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS volume_incentive_inr BIGINT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS volume_to_next_slab_inr BIGINT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_slab_incentive_inr BIGINT NOT NULL DEFAULT 0;

