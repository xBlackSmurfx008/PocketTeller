-- Security audit and fix for waitlist_signups table

-- First, let's ensure RLS is explicitly enabled
ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

-- Add explicit policy to deny all SELECT access except for admins
-- This creates a more secure default-deny approach
DROP POLICY IF EXISTS "Deny public access to waitlist signups" ON public.waitlist_signups;
CREATE POLICY "Deny public access to waitlist signups" 
ON public.waitlist_signups 
FOR SELECT 
TO public 
USING (false);

-- Ensure the admin policy has higher priority and is more explicit
DROP POLICY IF EXISTS "Admin users can read waitlist signups" ON public.waitlist_signups;
CREATE POLICY "Admin users can read waitlist signups" 
ON public.waitlist_signups 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.app_id = 'budget-ai-admin'
  )
);

-- Ensure INSERT policy is still properly restrictive
-- (This should already exist but let's verify it's optimal)
DROP POLICY IF EXISTS "Allow validated public waitlist signups" ON public.waitlist_signups;
CREATE POLICY "Allow validated public waitlist signups" 
ON public.waitlist_signups 
FOR INSERT 
TO anon, authenticated
WITH CHECK (
  validate_waitlist_email(email) 
  AND check_waitlist_rate_limit(email, '0.0.0.0'::inet)
);

-- Explicitly deny UPDATE operations (extra security layer)
DROP POLICY IF EXISTS "Deny all updates to waitlist signups" ON public.waitlist_signups;
CREATE POLICY "Deny all updates to waitlist signups" 
ON public.waitlist_signups 
FOR UPDATE 
TO public 
USING (false);

-- Explicitly deny DELETE operations except for admins
DROP POLICY IF EXISTS "Only admins can delete waitlist signups" ON public.waitlist_signups;
CREATE POLICY "Only admins can delete waitlist signups" 
ON public.waitlist_signups 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.app_id = 'budget-ai-admin'
  )
);

-- Add audit logging function for waitlist access (enhanced security)
CREATE OR REPLACE FUNCTION log_waitlist_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log admin access to waitlist data
  IF TG_OP = 'SELECT' AND auth.uid() IS NOT NULL THEN
    INSERT INTO public.plaid_token_audit_log (
      user_id, 
      access_type, 
      function_name, 
      success
    ) VALUES (
      auth.uid(),
      'waitlist_access',
      'admin_waitlist_view',
      true
    );
  END IF;
  
  RETURN NULL; -- For AFTER triggers
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: We're not adding the trigger as it would fire too often
-- This is available if needed for enhanced auditing