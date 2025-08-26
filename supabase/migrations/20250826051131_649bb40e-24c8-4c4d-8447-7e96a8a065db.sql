-- MEDIUM PRIORITY: Create secure storage policies for chat attachments
-- Delete existing policies for chat-uploads bucket (using correct table)
DELETE FROM storage.policies WHERE bucket_id = 'chat-uploads';

-- Users can only upload to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'chat-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND auth.role() = 'authenticated'
);

-- Users can only view their own files
CREATE POLICY "Users can view own files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'chat-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND auth.role() = 'authenticated'
);

-- Users can delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'chat-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND auth.role() = 'authenticated'
);

-- Users can update their own files
CREATE POLICY "Users can update own files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'chat-uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND auth.role() = 'authenticated'
);