-- Comprehensive Security Fixes Migration (Fixed)

-- 1. Create share_send_log table for audit and rate limiting
CREATE TABLE IF NOT EXISTS public.share_send_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    share_id UUID,
    channel TEXT NOT NULL, -- 'email' or 'sms'
    recipient_masked TEXT NOT NULL, -- masked email/phone for audit
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL DEFAULT false,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on share_send_log
ALTER TABLE public.share_send_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for share_send_log
CREATE POLICY "Service role can insert send logs" ON public.share_send_log
    FOR INSERT 
    TO service_role
    WITH CHECK (true);

CREATE POLICY "Users can view their own send logs" ON public.share_send_log
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Indexes for efficient rate limiting queries
CREATE INDEX IF NOT EXISTS idx_share_send_log_user_created ON public.share_send_log (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_share_send_log_channel_created ON public.share_send_log (channel, created_at);
CREATE INDEX IF NOT EXISTS idx_share_send_log_ip_created ON public.share_send_log (ip_address, created_at);

-- 2. Create rate limiting function
CREATE OR REPLACE FUNCTION public.check_share_send_rate(
    target_user_id UUID,
    channel_type TEXT,
    request_ip INET DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    user_recent_count INTEGER;
    ip_recent_count INTEGER;
    user_daily_count INTEGER;
BEGIN
    -- Check user rate limit: 5 per 15 minutes per channel
    SELECT COUNT(*) INTO user_recent_count
    FROM public.share_send_log
    WHERE user_id = target_user_id 
        AND channel = channel_type
        AND created_at > now() - INTERVAL '15 minutes';
    
    IF user_recent_count >= 5 THEN
        RETURN false;
    END IF;
    
    -- Check user daily limit: 20 per day overall
    SELECT COUNT(*) INTO user_daily_count
    FROM public.share_send_log
    WHERE user_id = target_user_id 
        AND created_at > now() - INTERVAL '24 hours';
    
    IF user_daily_count >= 20 THEN
        RETURN false;
    END IF;
    
    -- Check IP rate limit if provided: 10 per hour
    IF request_ip IS NOT NULL THEN
        SELECT COUNT(*) INTO ip_recent_count
        FROM public.share_send_log
        WHERE ip_address = request_ip
            AND created_at > now() - INTERVAL '1 hour';
        
        IF ip_recent_count >= 10 THEN
            RETURN false;
        END IF;
    END IF;
    
    RETURN true;
END;
$$;

-- 3. Restrict access to sensitive RPC functions
REVOKE EXECUTE ON FUNCTION public.encrypt_plaid_token(text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decrypt_plaid_token(jsonb, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decrypt_plaid_token_with_audit(jsonb, text, text, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.generate_secure_token() FROM PUBLIC;

-- Grant to service_role only
GRANT EXECUTE ON FUNCTION public.encrypt_plaid_token(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.decrypt_plaid_token(jsonb, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.decrypt_plaid_token_with_audit(jsonb, text, text, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.generate_secure_token() TO service_role;

-- 4. Add indexes for sharing model performance
CREATE INDEX IF NOT EXISTS idx_budget_shares_token ON public.budget_shares (token);
CREATE INDEX IF NOT EXISTS idx_budget_shares_expires_at ON public.budget_shares (expires_at);
CREATE INDEX IF NOT EXISTS idx_budget_shares_user_created ON public.budget_shares (user_id, created_at);

-- 5. Storage policies for chat-uploads bucket (drop existing first)
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;

CREATE POLICY "Users can upload their own files" ON storage.objects
    FOR INSERT 
    WITH CHECK (
        bucket_id = 'chat-uploads' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view their own files" ON storage.objects
    FOR SELECT 
    USING (
        bucket_id = 'chat-uploads' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own files" ON storage.objects
    FOR UPDATE 
    USING (
        bucket_id = 'chat-uploads' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own files" ON storage.objects
    FOR DELETE 
    USING (
        bucket_id = 'chat-uploads' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- 6. Fix Plaid token storage by removing non-existent column reference
CREATE OR REPLACE FUNCTION public.handle_plaid_token_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update last_token_rotation when encrypted_plaid_token changes
    IF OLD.encrypted_plaid_token IS DISTINCT FROM NEW.encrypted_plaid_token THEN
        NEW.last_token_rotation = now();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS plaid_token_update_trigger ON public.profiles;
CREATE TRIGGER plaid_token_update_trigger
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_plaid_token_update();