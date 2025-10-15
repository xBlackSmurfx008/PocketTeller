-- Increase Plaid link token rate limit for development/testing
-- Changed from 5 per hour to 50 per hour

CREATE OR REPLACE FUNCTION public.check_link_token_rate(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  access_count integer;
BEGIN
  -- Count link token creation attempts in the last hour
  SELECT COUNT(*) INTO access_count
  FROM public.plaid_token_audit_log
  WHERE user_id = target_user_id
    AND access_type = 'link_token'
    AND created_at > now() - interval '1 hour';
  
  -- Allow up to 50 link token creations per hour (increased from 5 for testing)
  RETURN access_count < 50;
END;
$function$;

COMMENT ON FUNCTION public.check_link_token_rate(uuid) IS 'Rate limit for Plaid link token creation - 50 per hour';

