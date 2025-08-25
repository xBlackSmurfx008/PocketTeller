-- Address remaining minor security issues

-- 1. Restrict site_metrics access to admin users only
DROP POLICY IF EXISTS "Authenticated users can read site metrics" ON public.site_metrics;

CREATE POLICY "Only admins can read site metrics"
ON public.site_metrics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND app_id = 'budget-ai-admin'
  )
);

-- Note: Leaked password protection must be enabled manually in Supabase Auth settings
-- This cannot be done via SQL migration