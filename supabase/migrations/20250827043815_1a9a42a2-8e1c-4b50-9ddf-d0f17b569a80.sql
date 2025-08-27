-- Fix search_path security issues in functions

-- 1. Fix is_admin_user function
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND app_id = 'budget-ai-admin'
  );
$$;

-- 2. Fix check_waitlist_rate_limit function
CREATE OR REPLACE FUNCTION public.check_waitlist_rate_limit(email_input text, ip_input inet)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
  
  -- Check IP rate limit (max 10 signups per day total)
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

-- 3. Fix validate_waitlist_email function
CREATE OR REPLACE FUNCTION public.validate_waitlist_email(email_input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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