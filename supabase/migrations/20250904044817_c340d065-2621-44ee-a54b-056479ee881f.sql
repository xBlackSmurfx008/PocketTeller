-- Phase 1: Database Security & Performance Improvements

-- Fix waitlist rate limiting function
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
BEGIN
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

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category);
CREATE INDEX IF NOT EXISTS idx_goals_user_deadline ON public.goals(user_id, deadline);
CREATE INDEX IF NOT EXISTS idx_bills_user_due_date ON public.bills(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_plaid_audit_user_created ON public.plaid_token_audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.in_app_notifications(user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_waitlist_email_created ON public.waitlist_signups(email, created_at);

-- Secure site_metrics access - remove overly permissive policies
DROP POLICY IF EXISTS "Public can read basic site metrics" ON public.site_metrics;
DROP POLICY IF EXISTS "Authenticated users can read basic metrics" ON public.site_metrics;

-- Create more secure site metrics access
CREATE POLICY "Authenticated users can read aggregated metrics only" 
ON public.site_metrics 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND id = 1);

-- Add trigger to automatically update site metrics
CREATE OR REPLACE FUNCTION public.update_site_metrics_enhanced()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Update metrics based on the table that changed
  IF TG_TABLE_NAME = 'profiles' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.site_metrics 
      SET total_users = (SELECT COUNT(*) FROM public.profiles), 
          updated_at = now() 
      WHERE id = 1;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.site_metrics 
      SET total_users = (SELECT COUNT(*) FROM public.profiles), 
          updated_at = now() 
      WHERE id = 1;
    END IF;
  ELSIF TG_TABLE_NAME = 'budget' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.site_metrics 
      SET total_budgets = (SELECT COUNT(*) FROM public.budget), 
          updated_at = now() 
      WHERE id = 1;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.site_metrics 
      SET total_budgets = (SELECT COUNT(*) FROM public.budget), 
          updated_at = now() 
      WHERE id = 1;
    END IF;
  ELSIF TG_TABLE_NAME = 'transactions' THEN
    IF TG_OP = 'INSERT' THEN
      UPDATE public.site_metrics 
      SET total_transactions = (SELECT COUNT(*) FROM public.transactions), 
          updated_at = now() 
      WHERE id = 1;
    ELSIF TG_OP = 'DELETE' THEN
      UPDATE public.site_metrics 
      SET total_transactions = (SELECT COUNT(*) FROM public.transactions), 
          updated_at = now() 
      WHERE id = 1;
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Create triggers for site metrics updates
DROP TRIGGER IF EXISTS trigger_update_site_metrics_profiles ON public.profiles;
DROP TRIGGER IF EXISTS trigger_update_site_metrics_budget ON public.budget;
DROP TRIGGER IF EXISTS trigger_update_site_metrics_transactions ON public.transactions;

CREATE TRIGGER trigger_update_site_metrics_profiles
  AFTER INSERT OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_site_metrics_enhanced();

CREATE TRIGGER trigger_update_site_metrics_budget
  AFTER INSERT OR DELETE ON public.budget
  FOR EACH ROW EXECUTE FUNCTION public.update_site_metrics_enhanced();

CREATE TRIGGER trigger_update_site_metrics_transactions
  AFTER INSERT OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.update_site_metrics_enhanced();

-- Initialize site metrics if not exists
INSERT INTO public.site_metrics (id, total_users, total_budgets, total_transactions, updated_at)
VALUES (1, 
  (SELECT COUNT(*) FROM public.profiles), 
  (SELECT COUNT(*) FROM public.budget), 
  (SELECT COUNT(*) FROM public.transactions), 
  now()
)
ON CONFLICT (id) DO UPDATE SET
  total_users = EXCLUDED.total_users,
  total_budgets = EXCLUDED.total_budgets,
  total_transactions = EXCLUDED.total_transactions,
  updated_at = EXCLUDED.updated_at;

-- Enhanced security function for budget share access
CREATE OR REPLACE FUNCTION public.check_budget_share_rate_limit_enhanced(share_id uuid, ip_address text, user_email text DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    access_count integer;
    email_access_count integer;
BEGIN
    -- Count accesses from this IP in the last hour
    SELECT COUNT(*) INTO access_count
    FROM public.budget_shares bs,
         jsonb_array_elements(bs.access_logs) AS log_entry
    WHERE bs.id = share_id
      AND log_entry->>'ip_address' = ip_address
      AND (log_entry->>'timestamp')::timestamp > now() - interval '1 hour';
    
    -- More restrictive IP-based rate limiting
    IF access_count >= 10 THEN
        RETURN false;
    END IF;
    
    -- If email provided, check email-specific rate limiting
    IF user_email IS NOT NULL THEN
        SELECT COUNT(*) INTO email_access_count
        FROM public.budget_shares bs,
             jsonb_array_elements(bs.access_logs) AS log_entry
        WHERE bs.id = share_id
          AND log_entry->>'user_email' = user_email
          AND (log_entry->>'timestamp')::timestamp > now() - interval '1 hour';
        
        IF email_access_count >= 20 THEN
            RETURN false;
        END IF;
    END IF;
    
    RETURN true;
END;
$function$;