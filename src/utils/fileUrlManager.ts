import { supabase } from '@/integrations/supabase/client';

interface UrlCache {
  url: string;
  expiresAt: number;
}

const urlCache = new Map<string, UrlCache>();

export const getSignedFileUrl = async (filePath: string, expiresIn = 3600): Promise<string | null> => {
  // Check cache first
  const cached = urlCache.get(filePath);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  try {
    // Use edge function for refreshing URLs to maintain security
    const { data, error } = await supabase.functions.invoke('refresh-file-url', {
      body: { filePath, expiresIn }
    });

    if (error) {
      console.error('Error refreshing signed URL:', error);
      return null;
    }

    // Cache the URL with expiration (subtract 5 minutes for safety margin)
    urlCache.set(filePath, {
      url: data.signedUrl,
      expiresAt: data.expiresAt - 300000 // Subtract 5 minutes in milliseconds
    });

    return data.signedUrl;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    return null;
  }
};

export const clearUrlCache = (filePath?: string) => {
  if (filePath) {
    urlCache.delete(filePath);
  } else {
    urlCache.clear();
  }
};