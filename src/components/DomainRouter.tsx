import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { shouldRedirectToDomain } from '@/utils/domainConfig';

export const DomainRouter = () => {
  const location = useLocation();

  useEffect(() => {
    // Only redirect when on actual pocketbanker.app domains, not in development/preview
    if (typeof window !== 'undefined' && window.location.hostname.endsWith('pocketbanker.app')) {
      const currentHost = window.location.hostname;
      
      // Special case: if on app.pocketbanker.app root, redirect to /budget
      if (currentHost === 'app.pocketbanker.app' && location.pathname === '/') {
        window.location.replace('https://app.pocketbanker.app/budget' + location.search + location.hash);
        return;
      }
      
      const redirectUrl = shouldRedirectToDomain(currentHost, location.pathname);
      
      if (redirectUrl) {
        window.location.replace(redirectUrl + location.search + location.hash);
      }
    }
  }, [location]);

  return null;
};