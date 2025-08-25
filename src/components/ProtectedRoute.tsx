import { useAuth } from '@/hooks/useAuth';
import { useDemo } from '@/hooks/useDemo';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { isDemo } = useDemo();

  // Show loading state while checking authentication
  if (loading) {
    return <div>Loading...</div>;
  }

  // Allow access if user is authenticated OR in demo mode
  if (user || isDemo) {
    return <>{children}</>;
  }

  // Redirect to auth page if not authenticated and not in demo
  return <Navigate to="/auth" replace />;
}