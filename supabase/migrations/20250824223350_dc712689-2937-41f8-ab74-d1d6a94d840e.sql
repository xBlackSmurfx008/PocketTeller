
-- 1) Store the user's preferred timezone on their profile
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS timezone TEXT;

-- 2) Expose timezone in the secure view used by the app
-- Keep security_invoker so underlying RLS is enforced
CREATE OR REPLACE VIEW public.profiles_secure
WITH (security_invoker = true)
AS
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
  (encrypted_plaid_token IS NOT NULL) AS has_plaid_connection,
  timezone
FROM public.profiles;
