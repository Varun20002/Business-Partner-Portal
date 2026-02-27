-- ═══════════════════════════════════════════════════════════════
-- Fix: Case-insensitive partner_uid matching
-- Google Sheets import stores partner_uid in UPPERCASE.
-- profiles.uid may be mixed/lowercase. RLS and queries must match.
-- ═══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Partners read own metrics" ON partner_metrics;
CREATE POLICY "Partners read own metrics"
  ON partner_metrics FOR SELECT
  USING (
    UPPER(TRIM(partner_uid)) = UPPER(TRIM((SELECT uid FROM profiles WHERE id = auth.uid())))
  );
