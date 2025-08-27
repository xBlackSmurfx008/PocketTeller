
-- 1) Ensure RLS is enabled and enforced even for table owners
ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_signups FORCE ROW LEVEL SECURITY;

-- 2) Remove any SELECT/UPDATE/DELETE policies (none should exist, but we enforce cleanup)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'waitlist_signups' 
      AND cmd IN ('SELECT','UPDATE','DELETE')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.waitlist_signups', pol.policyname);
  END LOOP;
END
$$;

-- 3) Replace any existing INSERT policy with a scoped, explicit one (anon + authenticated only)
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'waitlist_signups' 
      AND cmd = 'INSERT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.waitlist_signups', pol.policyname);
  END LOOP;
END
$$;

CREATE POLICY "Allow public inserts (anon + authenticated)"
ON public.waitlist_signups
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 4) Tighten privileges: explicitly prevent public SELECT; only allow INSERT
REVOKE ALL ON TABLE public.waitlist_signups FROM anon, authenticated;
GRANT INSERT ON TABLE public.waitlist_signups TO anon, authenticated;

-- 5) Ensure case-insensitive uniqueness is enforced (safe if already exists)
CREATE UNIQUE INDEX IF NOT EXISTS waitlist_signups_email_lower_idx
  ON public.waitlist_signups ((lower(email)));
