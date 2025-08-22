import React, { createContext, useContext, useState, useEffect } from 'react';

type LayoutMode = 'auto' | 'desktop';

interface LayoutPreferenceContextType {
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  isDesktopForced: boolean;
}

const LayoutPreferenceContext = createContext<LayoutPreferenceContextType | undefined>(undefined);

export function LayoutPreferenceProvider({ children }: { children: React.ReactNode }) {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('auto');

  useEffect(() => {
    const savedMode = localStorage.getItem('layout-preference') as LayoutMode;
    if (savedMode && (savedMode === 'auto' || savedMode === 'desktop')) {
      setLayoutMode(savedMode);
    }
  }, []);

  const handleSetLayoutMode = (mode: LayoutMode) => {
    setLayoutMode(mode);
    localStorage.setItem('layout-preference', mode);
  };

  const isDesktopForced = layoutMode === 'desktop';

  return (
    <LayoutPreferenceContext.Provider value={{
      layoutMode,
      setLayoutMode: handleSetLayoutMode,
      isDesktopForced,
    }}>
      {children}
    </LayoutPreferenceContext.Provider>
  );
}

export function useLayoutPreference() {
  const context = useContext(LayoutPreferenceContext);
  if (context === undefined) {
    throw new Error('useLayoutPreference must be used within a LayoutPreferenceProvider');
  }
  return context;
}