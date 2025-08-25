-- SECURITY FIXES FOR AUDIT TABLES AND FUNCTIONS

-- 1. Fix RLS on plaid_token_audit_log - restrict service role inserts to specific functions only
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.plaid_token_audit_log;

CREATE POLICY "Authorized functions can insert audit logs" 
ON public.plaid_token_audit_log 
FOR INSERT 
WITH CHECK (
  -- Only allow inserts from specific authorized functions or when user_id matches auth.uid()
  (auth.uid() = user_id) OR 
  (current_setting('role', true) = 'service_role' AND 
   current_setting('app.current_function_name', true) IN (
     'decrypt_plaid_token_with_audit',
     'rotate_plaid_token', 
     'clear_user_audit_logs',
     'get_secure_profile'
   ))
);

-- 2. Fix RLS on share_send_log - restrict service role inserts to specific functions only  
DROP POLICY IF EXISTS "Service role can log share activities" ON public.share_send_log;

CREATE POLICY "Authorized functions can log share activities"
ON public.share_send_log
FOR INSERT
WITH CHECK (
  -- Only allow inserts from specific authorized functions or when user_id matches auth.uid()
  (auth.uid() = user_id) OR
  (current_setting('role', true) = 'service_role' AND
   current_setting('app.current_function_name', true) IN (
     'send-budget-email',
     'send-budget-sms', 
     'share-get-budget-by-token-secure'
   ))
);

-- 3. Add column validation for share_send_log to ensure PII masking
CREATE OR REPLACE FUNCTION public.validate_share_send_log_insert()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for validation
DROP TRIGGER IF EXISTS validate_share_send_log_trigger ON public.share_send_log;
CREATE TRIGGER validate_share_send_log_trigger
  BEFORE INSERT ON public.share_send_log
  FOR EACH ROW EXECUTE FUNCTION public.validate_share_send_log_insert();

-- 4. Harden validate_share_access function to properly handle requires_auth
CREATE OR REPLACE FUNCTION public.validate_share_access(share_token text, request_ip text DEFAULT NULL::text, user_email text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    share_record RECORD;
    access_count integer;
    is_email_allowed boolean;
    current_user_id uuid;
BEGIN
    -- Get current user context (works for both authenticated users and service role)
    current_user_id := auth.uid();
    
    -- Find the share record with stronger validation
    SELECT * INTO share_record
    FROM public.budget_shares
    WHERE token = share_token
      AND expires_at > now()
      AND view_count < COALESCE(max_views, 10);
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired share');
    END IF;
    
    -- Enhanced authentication requirement check
    IF share_record.requires_auth THEN
        -- For service role calls, user_email must be provided and verified
        IF current_setting('role', true) = 'service_role' THEN
            IF user_email IS NULL THEN
                RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
            END IF;
            -- Service role calls with user_email are considered authenticated
        ELSE
            -- For regular calls, require authenticated user
            IF current_user_id IS NULL THEN
                RETURN jsonb_build_object('success', false, 'error', 'Authentication required');
            END IF;
        END IF;
    END IF;
    
    -- Enhanced email restrictions validation
    IF share_record.allowed_emails IS NOT NULL AND array_length(share_record.allowed_emails, 1) > 0 THEN
        IF user_email IS NULL THEN
            RETURN jsonb_build_object('success', false, 'error', 'Email verification required');
        END IF;
        
        -- Case-insensitive email matching with domain validation
        is_email_allowed := lower(user_email) = ANY(
            SELECT lower(unnest(share_record.allowed_emails))
        );
        
        IF NOT is_email_allowed THEN
            RETURN jsonb_build_object('success', false, 'error', 'Email not authorized');
        END IF;
    END IF;
    
    -- Enhanced rate limiting with IP validation
    IF request_ip IS NOT NULL THEN
        SELECT COUNT(*) INTO access_count
        FROM jsonb_array_elements(share_record.access_logs) AS log_entry
        WHERE log_entry->>'ip_address' = request_ip
          AND (log_entry->>'timestamp')::timestamp > now() - interval '1 hour';
        
        -- Strict rate limit for security
        IF access_count >= 5 THEN
            RETURN jsonb_build_object('success', false, 'error', 'Rate limit exceeded');
        END IF;
    END IF;
    
    -- Return the budget data securely
    RETURN jsonb_build_object(
        'success', true,
        'budget_data', share_record.budget_data,
        'share_id', share_record.id
    );
END;
$function$;

-- 5. Harden decrypt_plaid_token_with_audit function to validate token structure
CREATE OR REPLACE FUNCTION public.decrypt_plaid_token_with_audit(encrypted_data jsonb, encryption_key text, function_name text DEFAULT 'unknown'::text, ip_address text DEFAULT NULL::text, user_agent text DEFAULT NULL::text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  decrypted_token bytea;
  result_token text;
  target_user_id uuid;
BEGIN
  -- Validate encrypted_data structure
  IF encrypted_data IS NULL OR 
     NOT (encrypted_data ? 'encrypted_token') OR 
     NOT (encrypted_data ? 'iv') THEN
    RAISE EXCEPTION 'Invalid encrypted data structure';
  END IF;
  
  -- Validate base64 encoding of encrypted token
  BEGIN
    PERFORM decode(encrypted_data->>'encrypted_token', 'base64');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Invalid base64 encoding in encrypted token';
  END;
  
  -- Get the current user context
  target_user_id := auth.uid();
  
  -- If no auth context, this might be a service role call
  IF target_user_id IS NULL THEN
    -- For service role calls, we need to extract user_id from context
    target_user_id := current_setting('app.current_user_id', true)::uuid;
  END IF;

  -- Set function name in session for RLS validation
  PERFORM set_config('app.current_function_name', function_name, true);

  BEGIN
    -- Decrypt the token
    decrypted_token := pgp_sym_decrypt_bytea(
      decode(encrypted_data->>'encrypted_token', 'base64'),
      encryption_key
    );
    
    result_token := convert_from(decrypted_token, 'UTF8');
    
    -- Validate decrypted token format (basic Plaid token validation)
    IF result_token IS NULL OR length(result_token) < 10 THEN
      RAISE EXCEPTION 'Decrypted token appears invalid';
    END IF;
    
    -- Log successful decryption
    INSERT INTO public.plaid_token_audit_log (
      user_id, access_type, function_name, ip_address, user_agent, success
    ) VALUES (
      target_user_id, 'decrypt', function_name, ip_address::inet, user_agent, true
    );
    
    RETURN result_token;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Log failed decryption attempt
      INSERT INTO public.plaid_token_audit_log (
        user_id, access_type, function_name, ip_address, user_agent, success, error_message
      ) VALUES (
        target_user_id, 'decrypt', function_name, ip_address::inet, user_agent, false, SQLERRM
      );
      
      -- Return NULL on failure
      RETURN NULL;
  END;
END;
$function$;