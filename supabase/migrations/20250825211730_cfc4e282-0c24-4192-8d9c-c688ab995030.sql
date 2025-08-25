-- Create rate limiting function for link token creation
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
  
  -- Allow up to 5 link token creations per hour
  RETURN access_count < 5;
END;
$function$;

-- Create audit trigger to increment token access count
CREATE TRIGGER increment_token_access_audit_trigger
AFTER INSERT ON public.plaid_token_audit_log
FOR EACH ROW
EXECUTE FUNCTION public.increment_token_access_on_audit();