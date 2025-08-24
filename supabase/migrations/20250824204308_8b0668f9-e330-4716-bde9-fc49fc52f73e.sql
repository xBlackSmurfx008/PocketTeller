
-- 1) Remove any lingering plaintext token column
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS plaid_access_token;

-- 2) Restrict rotate_plaid_token to caller-only
CREATE OR REPLACE FUNCTION public.rotate_plaid_token(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  requester uuid;
  profile_record RECORD;
BEGIN
  requester := auth.uid();
  IF requester IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Only allow rotating your own token
  IF target_user_id IS DISTINCT FROM requester THEN
    RAISE EXCEPTION 'Operation not permitted';
  END IF;

  -- Get current profile
  SELECT * INTO profile_record 
  FROM public.profiles 
  WHERE user_id = target_user_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Clear encrypted token and mark rotation time (forces re-link)
  UPDATE public.profiles 
  SET 
    encrypted_plaid_token = NULL,
    token_iv = NULL,
    last_token_rotation = now()
  WHERE user_id = target_user_id;

  -- Log token rotation
  INSERT INTO public.plaid_token_audit_log (
    user_id, access_type, function_name, success
  ) VALUES (
    target_user_id, 'rotate', 'rotate_plaid_token', true
  );

  RETURN true;
END;
$function$;

-- 3) Automatically update token_access_count when a successful decrypt is logged
CREATE OR REPLACE FUNCTION public.increment_token_access_on_audit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.access_type = 'decrypt' AND NEW.success = true THEN
    UPDATE public.profiles
    SET token_access_count = COALESCE(token_access_count, 0) + 1
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_increment_token_access_on_audit ON public.plaid_token_audit_log;

CREATE TRIGGER trg_increment_token_access_on_audit
AFTER INSERT ON public.plaid_token_audit_log
FOR EACH ROW
EXECUTE FUNCTION public.increment_token_access_on_audit();

-- Helpful index for audit queries
CREATE INDEX IF NOT EXISTS idx_plaid_token_audit_log_user_time 
ON public.plaid_token_audit_log (user_id, created_at DESC);

-- 4) Allow users to revoke (update/delete) their own budget shares
CREATE POLICY "Users can update their own budget shares"
  ON public.budget_shares
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budget shares"
  ON public.budget_shares
  FOR DELETE
  USING (auth.uid() = user_id);

-- 5) Provide a safe view that avoids exposing encrypted fields in normal reads
CREATE OR REPLACE VIEW public.profiles_secure AS
SELECT
  user_id,
  app_id,
  created_at,
  updated_at,
  has_connected_voice_ui,
  last_token_rotation,
  token_access_count,
  last_suspicious_access_at,
  security_alerts_enabled,
  (encrypted_plaid_token IS NOT NULL) AS has_plaid_connection
FROM public.profiles;
