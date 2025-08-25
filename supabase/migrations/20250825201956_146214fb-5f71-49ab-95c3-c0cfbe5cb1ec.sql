
-- 1) Ensure a single site_metrics row exists
INSERT INTO public.site_metrics (id, total_users, total_budgets, total_transactions, updated_at)
SELECT 1, 0, 0, 0, now()
WHERE NOT EXISTS (SELECT 1 FROM public.site_metrics WHERE id = 1);

-- 2) Create triggers to keep site_metrics in sync
-- Users: driven by profiles table changes
CREATE TRIGGER update_site_metrics_on_profiles
AFTER INSERT OR DELETE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_site_metrics();

-- Budgets
CREATE TRIGGER update_site_metrics_on_budget
AFTER INSERT OR DELETE ON public.budget
FOR EACH ROW
EXECUTE FUNCTION public.update_site_metrics();

-- Transactions
CREATE TRIGGER update_site_metrics_on_transactions
AFTER INSERT OR DELETE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_site_metrics();

-- 3) Allow public (anon) to read the single metrics row for the landing page
-- Keep existing admin policy, but add a permissive policy limited to id=1
CREATE POLICY "Public can read site metrics row 1"
ON public.site_metrics
FOR SELECT
USING (id = 1);
