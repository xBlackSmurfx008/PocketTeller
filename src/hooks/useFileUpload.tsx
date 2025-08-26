import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileAttachment } from '@/hooks/useConversation';

export const useFileUpload = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());

  const uploadFile = useCallback(async (file: File): Promise<FileAttachment | null> => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be signed in to upload files",
        variant: "destructive",
      });
      return null;
    }

    const fileName = `${Date.now()}-${file.name}`;
    setUploadingFiles(prev => new Set([...prev, fileName]));

    try {
      // Validate file type and size
      const allowedTypes = ['image/', 'application/pdf', 'text/', 'application/json'];
      const maxSize = 10 * 1024 * 1024; // 10MB

      if (!allowedTypes.some(type => file.type.startsWith(type))) {
        throw new Error('Unsupported file type. Please upload images, PDFs, or text files.');
      }

      if (file.size > maxSize) {
        throw new Error('File size must be less than 10MB');
      }

      // Upload to Supabase Storage
      const filePath = `${user.id}/${fileName}`;
      const { error: uploadError } = await supabase.storage
        .from('chat-uploads')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get signed URL for private bucket (valid for 1 hour)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('chat-uploads')
        .createSignedUrl(filePath, 3600);

      if (signedUrlError) {
        throw signedUrlError;
      }

      const attachment: FileAttachment = {
        name: file.name,
        type: file.type,
        url: signedUrlData.signedUrl,
        path: filePath,
        status: 'ready'
      };

      toast({
        title: "Success",
        description: `${file.name} uploaded successfully`,
      });

      return attachment;

    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Error",
        description: error.message || 'Failed to upload file',
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileName);
        return newSet;
      });
    }
  }, [user, toast]);

  const uploadFiles = useCallback(async (files: FileList): Promise<FileAttachment[]> => {
    const uploadPromises = Array.from(files).map(file => uploadFile(file));
    const results = await Promise.all(uploadPromises);
    return results.filter((attachment): attachment is FileAttachment => attachment !== null);
  }, [uploadFile]);

  const removeFile = useCallback(async (filePath: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.storage
        .from('chat-uploads')
        .remove([filePath]);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "File removed successfully",
      });
    } catch (error: any) {
      console.error('Remove file error:', error);
      toast({
        title: "Error",
        description: "Failed to remove file",
        variant: "destructive",
      });
    }
  }, [user, toast]);

  return {
    uploadFile,
    uploadFiles,
    removeFile,
    uploadingFiles,
    isUploading: uploadingFiles.size > 0
  };
};