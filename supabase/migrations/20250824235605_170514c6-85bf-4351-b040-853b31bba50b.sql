-- Comprehensive Security Fixes

-- 1. Fix the flawed public budget share rate limiting
-- The current rate limit function has a logical flaw - it only counts when access_logs contains 
-- the exact IP, but access_logs is an array of objects, not simple values
CREATE OR REPLACE FUNCTION public.check_budget_share_rate_limit(share_id uuid, ip_address text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    access_count integer;
    log_entry jsonb;
BEGIN
    -- Count accesses from this IP in the last hour by properly parsing the access_logs array
    SELECT COUNT(*) INTO access_count
    FROM public.budget_shares bs,
         jsonb_array_elements(bs.access_logs) AS log_entry
    WHERE bs.id = share_id
      AND log_entry->>'ip_address' = ip_address
      AND (log_entry->>'timestamp')::timestamp > now() - interval '1 hour';
    
    -- Allow up to 10 accesses per IP per hour (reduced from 20 for better security)
    RETURN access_count < 10;
END;
$$;

-- 2. Create secure RPC for clearing audit logs (instead of allowing direct DELETE)
CREATE OR REPLACE FUNCTION public.clear_user_audit_logs()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    target_user_id uuid;
    deleted_count integer;
BEGIN
    target_user_id := auth.uid();
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Delete audit logs for the authenticated user only
    DELETE FROM public.plaid_token_audit_log 
    WHERE user_id = target_user_id;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the clearing action
    INSERT INTO public.plaid_token_audit_log (
        user_id, access_type, function_name, success
    ) VALUES (
        target_user_id, 'clear_logs', 'clear_user_audit_logs', true
    );
    
    RETURN true;
END;
$$;

-- 3. Ensure the increment trigger is properly attached
-- First drop if exists, then recreate to ensure it's properly attached
DROP TRIGGER IF EXISTS increment_token_access_trigger ON public.plaid_token_audit_log;

CREATE TRIGGER increment_token_access_trigger
    AFTER INSERT ON public.plaid_token_audit_log
    FOR EACH ROW
    EXECUTE FUNCTION public.increment_token_access_on_audit();

-- 4. Add input validation function for email content
CREATE OR REPLACE FUNCTION public.validate_email_content(content text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Check for basic HTML injection patterns
    IF content ~* '<script|javascript:|data:|vbscript:|on\w+\s*=' THEN
        RETURN false;
    END IF;
    
    -- Check for excessively long content (potential DoS)
    IF length(content) > 10000 THEN
        RETURN false;
    END IF;
    
    RETURN true;
END;
$$;