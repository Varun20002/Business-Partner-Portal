-- Allow partners to update only their own seen_dashboard flag.
-- Without this policy, RLS silently blocks the UPDATE and seen_dashboard
-- stays false even after the partner visits Resources.
CREATE POLICY "Partners update own seen_dashboard"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
