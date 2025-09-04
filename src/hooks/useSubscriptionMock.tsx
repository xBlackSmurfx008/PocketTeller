import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface SubscriptionState {
  isSubscribed: boolean;
  plan: string | null;
  expiresAt: string | null;
}

interface SubscriptionContextType {
  subscription: SubscriptionState;
  upgrade: (plan: string) => void;
  cancel: () => void;
  checkSubscription: () => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const STORAGE_KEY = 'mock_subscription';

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<SubscriptionState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return { isSubscribed: false, plan: null, expiresAt: null };
      }
    }
    return { isSubscribed: false, plan: null, expiresAt: null };
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subscription));
  }, [subscription]);

  const upgrade = (plan: string) => {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    
    setSubscription({
      isSubscribed: true,
      plan,
      expiresAt: expiresAt.toISOString()
    });
  };

  const cancel = () => {
    setSubscription({
      isSubscribed: false,
      plan: null,
      expiresAt: null
    });
  };

  const checkSubscription = () => {
    if (!subscription.isSubscribed || !subscription.expiresAt) {
      return false;
    }
    
    const now = new Date();
    const expiresAt = new Date(subscription.expiresAt);
    return now < expiresAt;
  };

  return (
    <SubscriptionContext.Provider value={{
      subscription,
      upgrade,
      cancel,
      checkSubscription
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}