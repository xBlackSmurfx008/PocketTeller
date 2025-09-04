import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type AccentColor = 'violet' | 'blue' | 'emerald' | 'amber' | 'rose';

interface AccentContextType {
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
  isLoading: boolean;
}

const AccentContext = createContext<AccentContextType | undefined>(undefined);

export function AccentProvider({ children }: { children: React.ReactNode }) {
  const [accentColor, setAccentColorState] = useState<AccentColor>('violet');
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadAccentColor = async () => {
      try {
        // Try to load from user profile if authenticated
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('accent_color')
            .eq('user_id', user.id)
            .single();
          
          if (profile?.accent_color) {
            setAccentColorState(profile.accent_color as AccentColor);
            localStorage.setItem('accent-color', profile.accent_color);
            updateCSSVariables(profile.accent_color as AccentColor);
          } else {
            // Fallback to localStorage
            const saved = localStorage.getItem('accent-color') as AccentColor;
            if (saved && ['violet', 'blue', 'emerald', 'amber', 'rose'].includes(saved)) {
              setAccentColorState(saved);
              updateCSSVariables(saved);
            } else {
              updateCSSVariables('violet');
            }
          }
        } else {
          // Not authenticated, use localStorage
          const saved = localStorage.getItem('accent-color') as AccentColor;
          if (saved && ['violet', 'blue', 'emerald', 'amber', 'rose'].includes(saved)) {
            setAccentColorState(saved);
            updateCSSVariables(saved);
          } else {
            updateCSSVariables('violet');
          }
        }
      } catch (error) {
        console.error('Error loading accent color:', error);
        updateCSSVariables('violet');
      } finally {
        setIsLoading(false);
      }
    };

    loadAccentColor();
  }, [user]);

  const updateCSSVariables = (color: AccentColor) => {
    const root = document.documentElement;
    const accentMap = {
      violet: '262 83% 58%',
      blue: '221 83% 53%',
      emerald: '142 76% 36%',
      amber: '45 93% 47%',
      rose: '330 81% 60%'
    };

    root.style.setProperty('--primary', accentMap[color]);
    root.style.setProperty('--ring', accentMap[color]);
  };

  const setAccentColor = async (color: AccentColor) => {
    try {
      setAccentColorState(color);
      localStorage.setItem('accent-color', color);
      updateCSSVariables(color);

      // Update user profile if authenticated
      if (user) {
        await supabase
          .from('profiles')
          .update({ accent_color: color })
          .eq('user_id', user.id);
      }
    } catch (error) {
      console.error('Error saving accent color:', error);
    }
  };

  return (
    <AccentContext.Provider value={{ accentColor, setAccentColor, isLoading }}>
      {children}
    </AccentContext.Provider>
  );
}

export function useAccent() {
  const context = useContext(AccentContext);
  if (context === undefined) {
    throw new Error('useAccent must be used within an AccentProvider');
  }
  return context;
}