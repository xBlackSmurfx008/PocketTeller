-- Fix storage policies for chat-uploads bucket
-- First, ensure the bucket is private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'chat-uploads';

-- Remove any overly permissive policies and create secure ones
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Public write access" ON storage.objects;

-- Create secure policies for chat-uploads
CREATE POLICY "Users can upload their own files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'chat-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own files" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'chat-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'chat-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'chat-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

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

-- Audit conversation RLS - strengthen policies
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can insert their own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON public.conversations;

-- Recreate with stronger validation
CREATE POLICY "Users can view own conversations only" 
ON public.conversations 
FOR SELECT 
USING (
  user_id = auth.uid() 
  AND user_id IS NOT NULL
);

CREATE POLICY "Users can insert own conversations only" 
ON public.conversations 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() 
  AND user_id IS NOT NULL
  AND role IN ('user', 'assistant')
);

CREATE POLICY "Users can delete own conversations only" 
ON public.conversations 
FOR DELETE 
USING (
  user_id = auth.uid() 
  AND user_id IS NOT NULL
);