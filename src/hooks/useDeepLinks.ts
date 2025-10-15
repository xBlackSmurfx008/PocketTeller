import { useEffect } from 'react';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

/**
 * Deep Link Handler Hook
 * 
 * Handles incoming deep links from:
 * - Email confirmation links (iOS Universal Links & Android App Links)
 * - Password reset links
 * - Custom URL schemes (pocketteller://)
 * 
 * When a user clicks an email confirmation link:
 * 1. iOS/Android intercepts the HTTPS URL (if app is installed)
 * 2. Opens the app with the full URL including query params
 * 3. This hook processes the URL and navigates to the correct route
 * 
 * Supported URL patterns:
 * - https://pocketbanker.app/confirm?token=...
 * - https://pocketbanker.app/reset-password?token=...
 * - pocketteller://confirm?token=...
 */
export function useDeepLinks() {
  const navigate = useNavigate();

  useEffect(() => {
    // Only set up deep link handling on native platforms
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const handleDeepLink = (event: URLOpenListenerEvent) => {
      const url = event.url;
      
      if (import.meta.env.DEV) {
        console.log('📱 Deep link received:', url);
      }

      try {
        // Parse the URL
        const urlObj = new URL(url);
        const pathname = urlObj.pathname;
        const search = urlObj.search;
        
        if (import.meta.env.DEV) {
          console.log('📱 Deep link pathname:', pathname);
          console.log('📱 Deep link search params:', search);
        }

        // Navigate to the appropriate route with query params
        // This will trigger the existing page logic (EmailConfirmation, ResetPassword, etc.)
        const fullPath = `${pathname}${search}`;
        
        if (import.meta.env.DEV) {
          console.log('📱 Navigating to:', fullPath);
        }
        
        navigate(fullPath, { replace: true });
      } catch (error) {
        console.error('❌ Error handling deep link:', error);
        // On error, navigate to home
        navigate('/home', { replace: true });
      }
    };

    // Register the deep link listener
    const listener = App.addListener('appUrlOpen', handleDeepLink);

    // Check if app was opened with a deep link (cold start)
    App.getLaunchUrl().then((launchUrl) => {
      if (launchUrl?.url) {
        if (import.meta.env.DEV) {
          console.log('📱 App launched with URL:', launchUrl.url);
        }
        handleDeepLink({ url: launchUrl.url });
      }
    });

    // Cleanup listener on unmount
    return () => {
      listener.remove();
    };
  }, [navigate]);
}

