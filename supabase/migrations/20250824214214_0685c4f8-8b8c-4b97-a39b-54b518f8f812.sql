-- Add unique index on budget_shares.token to prevent token collisions
CREATE UNIQUE INDEX IF NOT EXISTS idx_budget_shares_token_unique ON public.budget_shares(token);

-- Create trigger to automatically increment token access count when audit logs are created
CREATE OR REPLACE TRIGGER trigger_increment_token_access_on_audit
    AFTER INSERT ON public.plaid_token_audit_log
    FOR EACH ROW
    EXECUTE FUNCTION public.increment_token_access_on_audit();

-- Add rate limiting function for budget share access
CREATE OR REPLACE FUNCTION public.check_budget_share_rate_limit(share_id uuid, ip_address text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    access_count integer;
BEGIN
    -- Count accesses from this IP in the last hour
    SELECT COUNT(*) INTO access_count
    FROM public.budget_shares
    WHERE id = share_id
      AND access_logs @> jsonb_build_array(
        jsonb_build_object('ip_address', ip_address)
      )
      AND (access_logs->-1->>'timestamp')::timestamp > now() - interval '1 hour';
    
    -- Allow up to 20 accesses per IP per hour
    RETURN access_count < 20;
END;
$$;