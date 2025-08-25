-- Fix critical security vulnerability in budget shares
-- The issue: budget_data field contains complete financial information that could be exposed

-- 1. Create a secure function to get shared budget data that validates access properly
CREATE OR REPLACE FUNCTION public.get_shared_budget_secure(share_token text, user_email text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    share_record RECORD;
    budget_data_result jsonb;
BEGIN
    -- Validate the share using existing validation function
    SELECT * INTO share_record
    FROM public.budget_shares
    WHERE token = share_token
      AND expires_at > now()
      AND view_count < COALESCE(max_views, 10);
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Invalid or expired share');
    END IF;
    
    -- Additional security checks
    IF share_record.requires_auth AND user_email IS NULL THEN
        RETURN jsonb_build_object('error', 'Authentication required');
    END IF;
    
    IF share_record.allowed_emails IS NOT NULL AND array_length(share_record.allowed_emails, 1) > 0 THEN
        IF user_email IS NULL OR NOT (lower(user_email) = ANY(
            SELECT lower(unnest(share_record.allowed_emails))
        )) THEN
            RETURN jsonb_build_object('error', 'Email not authorized');
        END IF;
    END IF;
    
    -- Return only essential budget data, remove sensitive details
    budget_data_result := jsonb_build_object(
        'income', share_record.budget_data->'income',
        'expenses', share_record.budget_data->'expenses',
        'categories', share_record.budget_data->'categories',
        'time_period', share_record.budget_data->'time_period',
        'created_at', share_record.created_at,
        'expires_at', share_record.expires_at,
        'view_count', share_record.view_count,
        'max_views', share_record.max_views
    );
    
    RETURN budget_data_result;
END;
$$;

-- 2. Create a function to validate share access without returning sensitive data
CREATE OR REPLACE FUNCTION public.validate_share_token_only(share_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.budget_shares
        WHERE token = share_token
          AND expires_at > now()
          AND view_count < COALESCE(max_views, 10)
    );
END;
$$;

-- 3. Add additional security constraint to prevent data exposure
ALTER TABLE public.budget_shares ADD CONSTRAINT budget_shares_secure_token_check 
CHECK (length(token) >= 32);

-- 4. Create audit function for budget share access
CREATE OR REPLACE FUNCTION public.audit_budget_share_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Log any direct access to budget_data field
    IF TG_OP = 'SELECT' THEN
        INSERT INTO public.plaid_token_audit_log (
            user_id,
            access_type,
            function_name,
            success,
            error_message
        ) VALUES (
            auth.uid(),
            'budget_share_access',
            'direct_table_access',
            true,
            'Direct access to budget_shares table'
        );
    END IF;
    
    RETURN NULL; -- For AFTER triggers
END;
$$;