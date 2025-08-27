
-- Allow public read of the single homepage metrics row
-- Keeps metrics private except for id = 1 used on the public landing page
CREATE POLICY "Public can read homepage metrics"
  ON public.site_metrics
  FOR SELECT
  USING (id = 1);
