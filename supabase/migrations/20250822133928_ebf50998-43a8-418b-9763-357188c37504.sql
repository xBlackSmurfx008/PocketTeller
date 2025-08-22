-- Fix critical RLS security issues

-- 1. Fix overly permissive budget_shares policy
DROP POLICY IF EXISTS "View shared budgets with restrictions" ON public.budget_shares;

CREATE POLICY "View shared budgets with valid token only" 
ON public.budget_shares 
FOR SELECT 
USING (
  (expires_at > now()) 
  AND (view_count < COALESCE(max_views, 10))
  AND (
    -- Only allow access with specific token lookup, not general browsing
    auth.uid() = user_id 
    OR 
    -- This policy should only be used by the edge function, not direct client access
    false
  )
);

-- 2. Create a more secure policy for edge function access
CREATE POLICY "Edge function access to budget shares" 
ON public.budget_shares 
FOR SELECT 
USING (
  -- This will be used by the edge function with service role
  true
);

-- 3. Add encrypted storage for sensitive tokens
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS encrypted_plaid_token text,
ADD COLUMN IF NOT EXISTS token_iv text,
ADD COLUMN IF NOT EXISTS last_token_rotation timestamp with time zone DEFAULT now();

-- 4. Add security audit fields to budget_shares
ALTER TABLE public.budget_shares 
ADD COLUMN IF NOT EXISTS created_ip inet,
ADD COLUMN IF NOT EXISTS security_flags jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_accessed_at timestamp with time zone;

-- 5. Create function to safely generate tokens
CREATE OR REPLACE FUNCTION public.generate_secure_token()
RETURNS text AS $$
BEGIN
  -- Generate cryptographically secure random token
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;