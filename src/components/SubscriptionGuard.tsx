import { useEffect } from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { TrialExpiredModal } from './TrialExpiredModal';
import { useLocation } from 'react-router-dom';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

// Routes that require Pro subscription
const PROTECTED_ROUTES = [
  '/coach',
  '/accounts',
  '/budget',
  '/bills',
  '/goals',
  '/transactions',
  '/insights',
  '/home',
  '/chat',
  '/ai',
];

// Routes that are allowed even without Pro (for account deletion)
const ALLOWED_ROUTES = [
  '/settings',
  '/subscription',
  '/auth',
  '/',
];

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { isPro, isTrialExpired, trialEndDate, loading } = useSubscription();
  const location = useLocation();

  const isProtectedRoute = PROTECTED_ROUTES.some(route => 
    location.pathname.startsWith(route)
  );

  const isAllowedRoute = ALLOWED_ROUTES.some(route => 
    location.pathname === route || location.pathname.startsWith(route)
  );

  // Show modal if on a protected route and trial is expired
  const shouldShowModal = isProtectedRoute && isTrialExpired && !isPro && !loading;

  // Also show modal on allowed routes if trial expired (but don't block access)
  const showModalWarning = isTrialExpired && !isPro && !loading;

  return (
    <>
      {children}
      <TrialExpiredModal 
        open={shouldShowModal} 
        trialEndDate={trialEndDate}
      />
    </>
  );
}

