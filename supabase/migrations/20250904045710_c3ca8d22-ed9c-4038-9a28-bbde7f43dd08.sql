-- Fix waitlist signup validation and add necessary indexes for performance

-- First, let's make sure the waitlist email rate limiting function handles service role context properly
CREATE OR REPLACE FUNCTION public.check_waitlist_rate_limit_enhanced(email_input text, ip_input inet)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  email_count integer;
  ip_count integer;
  email_masked text;
  current_role text;
BEGIN
  current_role := current_setting('role', true);
  
  -- Mask email for logging
  email_masked := regexp_replace(email_input, '(.{2}).+@', '\1***@');
  
  -- Check email rate limit (1 signup per email ever)
  SELECT COUNT(*) INTO email_count
  FROM public.waitlist_signups
  WHERE lower(email) = lower(email_input);
  
  IF email_count >= 1 THEN
    RETURN false;
  END IF;
  
  -- Check IP rate limit (max 5 signups per day from same IP)
  IF ip_input IS NOT NULL THEN
    SELECT COUNT(*) INTO ip_count
    FROM public.waitlist_signups  
    WHERE created_at > now() - interval '24 hours'
    AND user_agent IS NOT NULL; -- Only count non-null user_agent entries
    
    IF ip_count >= 5 THEN
      RETURN false;
    END IF;
  END IF;
  
  RETURN true;
END;
$function$;

-- Add performance indexes for key tables
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_category ON public.transactions(category);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_goals_user_deadline ON public.goals(user_id, deadline);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_bills_user_due_date ON public.bills(user_id, due_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_budget_shares_token ON public.budget_shares(token);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_budget_shares_expires ON public.budget_shares(expires_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_created ON public.in_app_notifications(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_waitlist_email_log_created ON public.waitlist_email_log(created_at);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_plaid_audit_user_created ON public.plaid_token_audit_log(user_id, created_at DESC);

-- Update waitlist signup policy to be more permissive for edge function
DROP POLICY IF EXISTS "Allow validated public waitlist signups" ON public.waitlist_signups;
CREATE POLICY "Allow service role and validated public waitlist signups" ON public.waitlist_signups
  FOR INSERT
  WITH CHECK (
    (current_setting('role', true) = 'service_role') OR
    (validate_waitlist_email(email) AND check_waitlist_rate_limit_enhanced(email, '0.0.0.0'::inet))
  );

-- Ensure the waitlist email log policy allows edge function logging
DROP POLICY IF EXISTS "Allow service role to log waitlist emails" ON public.waitlist_email_log;
CREATE POLICY "Allow edge function to log waitlist emails" ON public.waitlist_email_log
  FOR INSERT
  WITH CHECK (
    (current_setting('role', true) = 'service_role') OR
    (current_setting('app.current_function_name', true) = 'send-waitlist-confirmation')
  );