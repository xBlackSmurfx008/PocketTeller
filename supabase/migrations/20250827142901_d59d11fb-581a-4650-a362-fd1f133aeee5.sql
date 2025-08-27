
-- Fix the waitlist email rate limiter to properly compare the masked email,
-- and add supporting indexes for performance.

CREATE OR REPLACE FUNCTION public.check_waitlist_email_rate(email_param text, ip_param inet)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_email_recent_count integer;
  v_email_daily_count integer;
  v_ip_daily_count integer;
  v_email_masked text;
BEGIN
  -- Mask the email consistently with the logger
  v_email_masked := regexp_replace(email_param, '(.{2}).+@', '\1***@');

  -- Per-email: max 2 per hour
  SELECT COUNT(*) INTO v_email_recent_count
  FROM public.waitlist_email_log l
  WHERE l.email_masked = v_email_masked
    AND l.created_at > now() - interval '1 hour';

  IF v_email_recent_count >= 2 THEN
    RETURN false;
  END IF;

  -- Per-email: max 5 per 24h
  SELECT COUNT(*) INTO v_email_daily_count
  FROM public.waitlist_email_log l
  WHERE l.email_masked = v_email_masked
    AND l.created_at > now() - interval '24 hours';

  IF v_email_daily_count >= 5 THEN
    RETURN false;
  END IF;

  -- Per-IP: max 10 per 24h
  IF ip_param IS NOT NULL THEN
    SELECT COUNT(*) INTO v_ip_daily_count
    FROM public.waitlist_email_log l
    WHERE l.ip_address = ip_param
      AND l.created_at > now() - interval '24 hours';

    IF v_ip_daily_count >= 10 THEN
      RETURN false;
    END IF;
  END IF;

  RETURN true;
END;
$function$;

-- Indexes to support the rate limiter lookups
CREATE INDEX IF NOT EXISTS idx_waitlist_email_log_email_time
  ON public.waitlist_email_log (email_masked, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_waitlist_email_log_ip_time
  ON public.waitlist_email_log (ip_address, created_at DESC);
