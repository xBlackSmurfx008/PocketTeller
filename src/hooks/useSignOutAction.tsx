import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDemo } from '@/hooks/useDemo';

export function useSignOutAction() {
  const { signOut } = useAuth();
  const { isDemo, exitDemo } = useDemo();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    if (isDemo) {
      exitDemo();
      navigate('/');
    } else {
      await signOut();
      // signOut already handles navigation to /auth
    }
  };

  return {
    handleSignOut,
    isDemo
  };
}