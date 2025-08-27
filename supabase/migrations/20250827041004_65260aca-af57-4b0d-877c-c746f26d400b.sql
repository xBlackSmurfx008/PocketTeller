-- Check if the functions already exist, if not create them
DO $$
BEGIN
    -- Create has_recent_waitlist_signup function if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'has_recent_waitlist_signup') THEN
        EXECUTE $func$
        CREATE OR REPLACE FUNCTION public.has_recent_waitlist_signup(email_param text, days_param integer DEFAULT 30)
        RETURNS boolean
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path TO 'public'
        AS $inner$
        DECLARE
          signup_exists boolean;
        BEGIN
          SELECT EXISTS(
            SELECT 1 
            FROM public.waitlist_signups 
            WHERE lower(email) = lower(email_param)
              AND created_at > now() - (days_param || ' days')::interval
          ) INTO signup_exists;
          
          RETURN signup_exists;
        END;
        $inner$;
        $func$;
    END IF;

    -- Create check_waitlist_email_rate function if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_waitlist_email_rate') THEN
        EXECUTE $func2$
        CREATE OR REPLACE FUNCTION public.check_waitlist_email_rate(email_param text, ip_param inet)
        RETURNS boolean
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path TO 'public'
        AS $inner2$
        DECLARE
          email_recent_count integer;
          email_daily_count integer;
          ip_daily_count integer;
          email_masked text;
        BEGIN
          -- Mask the email for comparison
          email_masked := regexp_replace(email_param, '(.{2}).+@', '\1***@');
          
          -- Check per-email limits: 2 per hour
          SELECT COUNT(*) INTO email_recent_count
          FROM public.waitlist_email_log
          WHERE email_masked = email_masked
            AND created_at > now() - interval '1 hour';
          
          IF email_recent_count >= 2 THEN
            RETURN false;
          END IF;
          
          -- Check per-email daily limit: 5 per day
          SELECT COUNT(*) INTO email_daily_count
          FROM public.waitlist_email_log
          WHERE email_masked = email_masked
            AND created_at > now() - interval '24 hours';
          
          IF email_daily_count >= 5 THEN
            RETURN false;
          END IF;
          
          -- Check per-IP daily limit: 10 per day
          IF ip_param IS NOT NULL THEN
            SELECT COUNT(*) INTO ip_daily_count
            FROM public.waitlist_email_log
            WHERE ip_address = ip_param
              AND created_at > now() - interval '24 hours';
            
            IF ip_daily_count >= 10 THEN
              RETURN false;
            END IF;
          END IF;
          
          RETURN true;
        END;
        $inner2$;
        $func2$;
    END IF;
END
$$;