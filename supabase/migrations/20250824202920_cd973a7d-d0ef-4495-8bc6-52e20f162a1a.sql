-- Remove the overly permissive RLS policy that allows unrestricted access
DROP POLICY IF EXISTS "Edge function access to budget shares" ON public.budget_shares;

-- The edge function uses service role key which bypasses RLS entirely,
-- so we don't need any permissive policies for edge function access.
-- The existing policies for user access and token-based access remain intact.