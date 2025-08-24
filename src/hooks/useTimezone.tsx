
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export function useTimezone() {
  const { user } = useAuth();
  const [timezone, setTimezone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchAndSetTimezone = async () => {
      try {
        // First, get the user's saved timezone from the database
        const { data: profile } = await supabase
          .from('profiles_secure')
          .select('timezone')
          .eq('user_id', user.id)
          .single();

        const savedTimezone = profile?.timezone;
        
        if (savedTimezone) {
          setTimezone(savedTimezone);
        } else {
          // Auto-detect browser timezone and save it
          const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          setTimezone(browserTimezone);
          
          // Save to database
          await supabase
            .from('profiles')
            .update({ timezone: browserTimezone })
            .eq('user_id', user.id);
        }
      } catch (error) {
        console.error('Error managing timezone:', error);
        // Fallback to browser timezone
        const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        setTimezone(browserTimezone);
      } finally {
        setLoading(false);
      }
    };

    fetchAndSetTimezone();
  }, [user]);

  const updateTimezone = async (newTimezone: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ timezone: newTimezone })
        .eq('user_id', user.id);

      if (error) throw error;
      
      setTimezone(newTimezone);
      return true;
    } catch (error) {
      console.error('Error updating timezone:', error);
      return false;
    }
  };

  return {
    timezone,
    loading,
    updateTimezone,
  };
}
