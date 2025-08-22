-- Fix function search path security warnings
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_budget_share_access(
  share_id UUID,
  ip_address TEXT DEFAULT NULL,
  user_agent TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  access_log JSONB;
BEGIN
  access_log := jsonb_build_object(
    'timestamp', now(),
    'ip_address', ip_address,
    'user_agent', user_agent
  );
  
  UPDATE public.budget_shares 
  SET access_logs = COALESCE(access_logs, '[]'::jsonb) || access_log
  WHERE id = share_id;
END;
$$;