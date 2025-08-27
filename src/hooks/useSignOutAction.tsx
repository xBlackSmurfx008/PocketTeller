import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDemo } from '@/hooks/useDemo';

export function useSignOutAction() {
  const { signOut } = useAuth();
  const { isDemo, exitDemo } = useDemo();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      if (isDemo) {
        exitDemo();
        navigate('/');
      } else {
        const { error } = await signOut();
        if (error) {
          console.error('Sign out error:', error);
          // Still navigate even if sign out fails
        }
        navigate('/auth', { replace: true });
      }
    } catch (error) {
      console.error('Unexpected sign out error:', error);
      // Force navigation to auth page even on error
      navigate('/auth', { replace: true });
    }
  };

  return {
    handleSignOut,
    isDemo
  };
}