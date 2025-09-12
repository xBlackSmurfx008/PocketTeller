-- Fix the validate_waitlist_email function that's still overly restrictive
-- This replaces the old function with the corrected version

DROP FUNCTION IF EXISTS public.validate_waitlist_email(text);

CREATE OR REPLACE FUNCTION public.validate_waitlist_email(email_input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Basic email format validation
  IF email_input !~ '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$' THEN
    RETURN false;
  END IF;
  
  -- Check length limits
  IF length(email_input) > 254 OR length(email_input) < 5 THEN
    RETURN false;
  END IF;
  
  -- Only block obvious bot/spam patterns, not legitimate words
  -- Block only clearly malicious patterns like multiple consecutive dots
  IF email_input ~* '\.\.' OR email_input ~* '^\.|\.$' THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;