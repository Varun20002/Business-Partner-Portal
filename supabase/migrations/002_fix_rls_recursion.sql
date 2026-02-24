-- ═══════════════════════════════════════════════════════════════
-- Fix: Infinite recursion in RLS policies
-- The "Admins read all profiles" policy queries the profiles
-- table itself, causing infinite recursion. Fix: use a
-- SECURITY DEFINER function that bypasses RLS.
-- ═══════════════════════════════════════════════════════════════

-- 1. Create a helper function that bypasses RLS to check admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 2. Fix PROFILES policies
DROP POLICY IF EXISTS "Admins read all profiles" ON profiles;
CREATE POLICY "Admins read all profiles"
  ON profiles FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins insert profiles" ON profiles;
CREATE POLICY "Admins insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (public.is_admin());

-- 3. Fix PARTNER_METRICS policies
DROP POLICY IF EXISTS "Admins read all metrics" ON partner_metrics;
CREATE POLICY "Admins read all metrics"
  ON partner_metrics FOR SELECT
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins manage metrics" ON partner_metrics;
CREATE POLICY "Admins manage metrics"
  ON partner_metrics FOR ALL
  USING (public.is_admin());

-- 4. Fix WEBINARS policies
DROP POLICY IF EXISTS "Admins manage webinars" ON webinars;
CREATE POLICY "Admins manage webinars"
  ON webinars FOR ALL
  USING (public.is_admin());

-- 5. Fix MARKETING_MATERIALS policies
DROP POLICY IF EXISTS "Admins manage materials" ON marketing_materials;
CREATE POLICY "Admins manage materials"
  ON marketing_materials FOR ALL
  USING (public.is_admin());

-- 6. Fix FAQS policies
DROP POLICY IF EXISTS "Admins manage faqs" ON faqs;
CREATE POLICY "Admins manage faqs"
  ON faqs FOR ALL
  USING (public.is_admin());

-- 7. Fix STORAGE policies
DROP POLICY IF EXISTS "Admins upload portal assets" ON storage.objects;
CREATE POLICY "Admins upload portal assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'portal-assets' AND public.is_admin()
  );

DROP POLICY IF EXISTS "Admins delete portal assets" ON storage.objects;
CREATE POLICY "Admins delete portal assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'portal-assets' AND public.is_admin()
  );

-- 8. Now insert the admin profile (this will work after fixing the policies)
INSERT INTO profiles (id, uid, role)
VALUES ('029bbc06-73f9-4bd8-b53b-ff1e9c154200', 'AD00000001', 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin';




