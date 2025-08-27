
-- Restore public read access for basic site metrics (row id=1) to fix landing page KPIs
CREATE POLICY "Public can read basic site metrics"
  ON public.site_metrics
  FOR SELECT
  TO public
  USING (id = 1);
