import { useEffect } from 'react';
import { useDemo } from '@/hooks/useDemo';
import { useNavigate } from 'react-router-dom';
import Dashboard from '@/components/Dashboard';

export default function Demo() {
  const { startDemo } = useDemo();
  const navigate = useNavigate();

  useEffect(() => {
    startDemo();
    navigate('/', { replace: true });
  }, [startDemo, navigate]);

  return <Dashboard />;
}