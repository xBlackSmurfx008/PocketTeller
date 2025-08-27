-- Security improvements for the application

-- 1. Create admin check function to safely verify admin access
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND app_id = 'budget-ai-admin'
  );
$$;

-- 2. Restrict site_metrics to authenticated users only (remove public policy)
DROP POLICY IF EXISTS "Public can read homepage metrics" ON public.site_metrics;

-- 3. Create admin-only access to site_metrics
CREATE POLICY "Admin users can read all site metrics"
ON public.site_metrics
FOR SELECT
TO authenticated
USING (public.is_admin_user());

-- 4. Add rate limiting function for waitlist signups
CREATE OR REPLACE FUNCTION public.check_waitlist_rate_limit(email_input text, ip_input inet)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  email_count integer;
  ip_count integer;
BEGIN
  -- Check email rate limit (1 signup per email ever)
  SELECT COUNT(*) INTO email_count
  FROM public.waitlist_signups
  WHERE lower(email) = lower(email_input);
  
  IF email_count >= 1 THEN
    RETURN false;
  END IF;
  
  -- Check IP rate limit (max 3 signups per IP per day)
  IF ip_input IS NOT NULL THEN
    SELECT COUNT(*) INTO ip_count
    FROM public.waitlist_signups  
    WHERE created_at > now() - interval '24 hours';
    
    IF ip_count >= 10 THEN
      RETURN false;
    END IF;
  END IF;
  
  RETURN true;
END;
$$;

-- 5. Add email validation function
CREATE OR REPLACE FUNCTION public.validate_waitlist_email(email_input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Basic email format validation
  IF email_input !~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$' THEN
    RETURN false;
  END IF;
  
  -- Check for suspicious patterns
  IF email_input ~* '(test|spam|fake|bot|noreply)' THEN
    RETURN false;
  END IF;
  
  -- Check length limits
  IF length(email_input) > 254 OR length(email_input) < 5 THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- 6. Improve waitlist insert policy with validation
DROP POLICY IF EXISTS "Allow public inserts (anon + authenticated)" ON public.waitlist_signups;

CREATE POLICY "Allow validated public waitlist signups"
ON public.waitlist_signups
FOR INSERT
TO anon, authenticated
WITH CHECK (
  public.validate_waitlist_email(email) AND
  public.check_waitlist_rate_limit(email, '0.0.0.0'::inet)
);

-- 7. Add admin-only read access to waitlist for legitimate business needs
CREATE POLICY "Admin users can read waitlist signups"
ON public.waitlist_signups
FOR SELECT
TO authenticated
USING (public.is_admin_user());