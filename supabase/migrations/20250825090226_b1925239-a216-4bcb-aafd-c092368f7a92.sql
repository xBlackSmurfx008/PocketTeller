-- Fix the site_metrics policy (drop and recreate)
DROP POLICY IF EXISTS "Authenticated users can read site metrics" ON public.site_metrics;
CREATE POLICY "Authenticated users can read site metrics" ON public.site_metrics
  FOR SELECT 
  TO authenticated
  USING (auth.uid() IS NOT NULL);