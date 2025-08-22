-- Create chat-uploads storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-uploads', 'chat-uploads', false);

-- Create storage policies for chat uploads
CREATE POLICY "Users can upload their own files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'chat-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'chat-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'chat-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add attachments column to conversations table
ALTER TABLE public.conversations ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;