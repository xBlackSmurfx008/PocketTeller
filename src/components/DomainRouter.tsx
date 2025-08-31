import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { shouldRedirectToDomain } from '@/utils/domainConfig';

export const DomainRouter = () => {
  const location = useLocation();

  useEffect(() => {
    // Only redirect in production, not in development
    if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
      const currentHost = window.location.hostname;
      const redirectUrl = shouldRedirectToDomain(currentHost, location.pathname);
      
      if (redirectUrl) {
        window.location.replace(redirectUrl + location.search + location.hash);
      }
    }
  }, [location]);

  return null;
};