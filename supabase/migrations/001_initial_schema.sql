-- ═══════════════════════════════════════════════════════════════
-- CoinDCX Partner Portal — Initial Schema Migration
-- ═══════════════════════════════════════════════════════════════

-- 1. Create custom enum for user roles
CREATE TYPE user_role AS ENUM ('partner', 'admin');

-- ───────────────────────────────────────────────────────────────
-- 2. PROFILES table
-- ───────────────────────────────────────────────────────────────
CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  uid        VARCHAR(20) UNIQUE NOT NULL,       -- e.g. 'VA51243378'
  role       user_role NOT NULL DEFAULT 'partner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Partners can read their own profile
CREATE POLICY "Partners read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can insert profiles
CREATE POLICY "Admins insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role can manage profiles (for auth triggers)
CREATE POLICY "Service role manages profiles"
  ON profiles FOR ALL
  USING (auth.role() = 'service_role');

-- ───────────────────────────────────────────────────────────────
-- 3. PARTNER_METRICS table
-- ───────────────────────────────────────────────────────────────
CREATE TABLE partner_metrics (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_uid           VARCHAR(20) NOT NULL REFERENCES profiles(uid) ON DELETE CASCADE,
  total_users           INTEGER NOT NULL DEFAULT 0,
  traded_users          INTEGER NOT NULL DEFAULT 0,
  eligible_500_users    INTEGER NOT NULL DEFAULT 0,
  volume_eligible_users INTEGER NOT NULL DEFAULT 0,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE partner_metrics ENABLE ROW LEVEL SECURITY;

-- Partners can read their own metrics
CREATE POLICY "Partners read own metrics"
  ON partner_metrics FOR SELECT
  USING (
    partner_uid = (SELECT uid FROM profiles WHERE id = auth.uid())
  );

-- Admins can read all metrics
CREATE POLICY "Admins read all metrics"
  ON partner_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can manage metrics
CREATE POLICY "Admins manage metrics"
  ON partner_metrics FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role (data pipeline) can manage metrics
CREATE POLICY "Service role manages metrics"
  ON partner_metrics FOR ALL
  USING (auth.role() = 'service_role');

-- ───────────────────────────────────────────────────────────────
-- 4. WEBINARS table
-- ───────────────────────────────────────────────────────────────
CREATE TABLE webinars (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         VARCHAR(255) NOT NULL,
  poster_url    VARCHAR(500) NOT NULL,
  external_link VARCHAR(500) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE webinars ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read webinars
CREATE POLICY "Authenticated users read webinars"
  ON webinars FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admins can manage webinars
CREATE POLICY "Admins manage webinars"
  ON webinars FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ───────────────────────────────────────────────────────────────
-- 5. MARKETING_MATERIALS table
-- ───────────────────────────────────────────────────────────────
CREATE TABLE marketing_materials (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                VARCHAR(255) NOT NULL,
  image_url            VARCHAR(500) NOT NULL,
  share_text_template  TEXT NOT NULL DEFAULT '',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE marketing_materials ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read materials
CREATE POLICY "Authenticated users read materials"
  ON marketing_materials FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admins can manage materials
CREATE POLICY "Admins manage materials"
  ON marketing_materials FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ───────────────────────────────────────────────────────────────
-- 6. FAQS table
-- ───────────────────────────────────────────────────────────────
CREATE TABLE faqs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question      TEXT NOT NULL,
  answer        TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read FAQs
CREATE POLICY "Authenticated users read faqs"
  ON faqs FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admins can manage FAQs
CREATE POLICY "Admins manage faqs"
  ON faqs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ───────────────────────────────────────────────────────────────
-- 7. Storage bucket for uploads
-- ───────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('portal-assets', 'portal-assets', true);

-- Anyone can read public assets
CREATE POLICY "Public read portal assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portal-assets');

-- Admins can upload assets
CREATE POLICY "Admins upload portal assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'portal-assets'
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete assets
CREATE POLICY "Admins delete portal assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'portal-assets'
    AND EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ───────────────────────────────────────────────────────────────
-- 8. Indexes for performance
-- ───────────────────────────────────────────────────────────────
CREATE INDEX idx_partner_metrics_uid ON partner_metrics(partner_uid);
CREATE INDEX idx_profiles_uid ON profiles(uid);
CREATE INDEX idx_faqs_order ON faqs(display_order);
CREATE INDEX idx_webinars_created ON webinars(created_at DESC);
CREATE INDEX idx_materials_created ON marketing_materials(created_at DESC);
