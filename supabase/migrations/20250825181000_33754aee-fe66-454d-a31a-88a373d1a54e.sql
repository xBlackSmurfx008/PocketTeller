-- Fix remaining security issues

-- 1. Fix function search path issues by ensuring all functions have explicit search_path
CREATE OR REPLACE FUNCTION public.validate_share_send_log_insert()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Ensure recipient_masked doesn't contain full email/phone
  IF NEW.recipient_masked ~* '@.*\.[a-z]{2,}$' THEN
    RAISE EXCEPTION 'recipient_masked contains unmasked email address';
  END IF;
  
  IF NEW.recipient_masked ~ '^\+?[0-9]{10,}$' THEN
    RAISE EXCEPTION 'recipient_masked contains unmasked phone number';
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2. Update edge functions to set function name context for RLS validation
-- This will be done via updating the edge function files directly