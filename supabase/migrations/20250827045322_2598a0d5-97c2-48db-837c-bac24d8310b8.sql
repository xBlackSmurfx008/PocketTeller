-- Drop any existing conflicting policies that might allow public access
DROP POLICY IF EXISTS "Public can read waitlist signups" ON public.waitlist_signups;
DROP POLICY IF EXISTS "Allow public reads" ON public.waitlist_signups;
DROP POLICY IF EXISTS "Users can read waitlist" ON public.waitlist_signups;

-- Ensure only the admin read policy exists and is properly restrictive
DROP POLICY IF EXISTS "Admin users can read waitlist signups" ON public.waitlist_signups;

-- Create a secure admin-only read policy
CREATE POLICY "Admin users can read waitlist signups"
  ON public.waitlist_signups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND app_id = 'budget-ai-admin'
    )
  );

-- Verify RLS is enabled (should already be enabled)
ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;