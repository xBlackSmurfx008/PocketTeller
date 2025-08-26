-- Fix storage bucket to be private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'chat-uploads';

-- Lock down site_metrics access - remove public access  
DROP POLICY IF EXISTS "Public can read site metrics row 1" ON public.site_metrics;

-- Only allow authenticated users to read basic metrics
CREATE POLICY "Authenticated users can read basic metrics" 
ON public.site_metrics 
FOR SELECT 
USING (
  auth.uid() IS NOT NULL 
  AND id = 1
);