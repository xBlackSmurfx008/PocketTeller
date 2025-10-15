import { useDeepLinks } from '@/hooks/useDeepLinks';

/**
 * Deep Link Handler Component
 * 
 * This component must be placed inside BrowserRouter to have access to navigate()
 * It sets up listeners for deep link events from iOS/Android
 * 
 * When a user clicks an email confirmation link on their phone:
 * 1. iOS/Android opens the app (via Universal Links/App Links)
 * 2. This component receives the URL with all query params
 * 3. Navigates to the correct route (e.g., /confirm?token=...)
 * 4. The EmailConfirmation page handles the actual confirmation logic
 */
export function DeepLinkHandler() {
  useDeepLinks();
  return null; // This component doesn't render anything
}

