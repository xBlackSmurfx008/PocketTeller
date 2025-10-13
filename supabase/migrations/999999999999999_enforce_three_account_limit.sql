-- Enforce 3 bank account connection limit per user
-- This ensures users can connect up to 3 different financial institutions

-- Function to check if user has reached the 3-account limit
CREATE OR REPLACE FUNCTION public.check_plaid_item_limit()
RETURNS TRIGGER AS $$
BEGIN
  -- Count existing plaid_items for this user
  IF (
    SELECT COUNT(*)
    FROM public.plaid_items
    WHERE user_id = NEW.user_id
  ) >= 3 THEN
    RAISE EXCEPTION 'Maximum of 3 bank connections allowed. Please disconnect an existing account before adding a new one.'
      USING ERRCODE = 'P0001',
            HINT = 'Upgrade to Pro for unlimited connections';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to enforce limit on INSERT
DROP TRIGGER IF EXISTS enforce_plaid_item_limit ON public.plaid_items;
CREATE TRIGGER enforce_plaid_item_limit
  BEFORE INSERT ON public.plaid_items
  FOR EACH ROW
  EXECUTE FUNCTION public.check_plaid_item_limit();

-- Add helpful comment
COMMENT ON FUNCTION public.check_plaid_item_limit() IS 'Enforces maximum of 3 bank connections per user';

-- Create helper function to get user's connection count
CREATE OR REPLACE FUNCTION public.get_user_plaid_item_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.plaid_items
  WHERE user_id = p_user_id;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_user_plaid_item_count(UUID) IS 'Returns the number of connected banks for a user';

