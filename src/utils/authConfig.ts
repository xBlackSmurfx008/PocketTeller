// Centralized auth configuration for consistent redirect URLs

/**
 * Get the appropriate redirect URL for auth callbacks
 * Uses HTTPS URLs which work for both web and mobile (via Universal Links/App Links)
 * 
 * IMPORTANT: This must match the URLs configured in:
 * - iOS: Info.plist com.apple.developer.associated-domains
 * - Android: AndroidManifest.xml intent-filter with autoVerify
 * - Web: .well-known/apple-app-site-association and assetlinks.json
 * 
 * When users click email links:
 * - On mobile: iOS/Android will intercept HTTPS links and open the app
 * - On web: Browser navigates to the URL normally
 */
export const getAuthRedirectUrl = (path: string = '') => {
  // Use production HTTPS domain for Universal Links/App Links
  // This works for both web and mobile apps
  const baseUrl = 'https://pocketbanker.app';
  return `${baseUrl}${path}`;
};

export const AuthConfig = {
  // Email confirmation redirect
  // Mobile: Opens app via Universal Link → /confirm route
  // Web: Opens browser → /confirm route
  emailConfirmRedirect: getAuthRedirectUrl('/confirm'),
  
  // Password reset redirect  
  // Mobile: Opens app via Universal Link → /reset-password route
  // Web: Opens browser → /reset-password route
  passwordResetRedirect: getAuthRedirectUrl('/reset-password'),
  
  // Default post-auth redirect
  defaultRedirect: getAuthRedirectUrl('/'),
  
  // OTP/Email confirmation expiration
  // Default Supabase: 60 seconds (too short!)
  // Recommended: 900 seconds (15 minutes)
  // Configure in Supabase Dashboard: Authentication → Settings → Email Auth
  // Set MAILER_OTP_EXP=900
  otpExpirationSeconds: 900, // 15 minutes
  
  // Error messages
  errorMessages: {
    emailNotConfirmed: 'Please check your email and click the confirmation link to activate your account.',
    invalidCredentials: 'Invalid email or password. Please check your credentials and try again.',
    userAlreadyExists: 'An account with this email already exists. Try signing in instead.',
    weakPassword: 'Password should be at least 6 characters long.',
    networkError: 'Network error. Please check your connection and try again.',
    tokenExpired: 'The verification link has expired (15 minute limit). Please request a new one.',
    generic: 'An unexpected error occurred. Please try again.',
  }
};

export const getErrorMessage = (error: any): string => {
  if (!error?.message) return AuthConfig.errorMessages.generic;
  
  const message = error.message.toLowerCase();
  
  if (message.includes('email not confirmed') || message.includes('confirm your email')) {
    return AuthConfig.errorMessages.emailNotConfirmed;
  }
  
  if (message.includes('invalid login credentials') || 
      message.includes('invalid email or password') ||
      message.includes('invalid credentials')) {
    return AuthConfig.errorMessages.invalidCredentials;
  }
  
  if (message.includes('user already registered') || 
      message.includes('already registered') ||
      message.includes('email address is already registered')) {
    return AuthConfig.errorMessages.userAlreadyExists;
  }
  
  if (message.includes('password') && (message.includes('weak') || message.includes('short'))) {
    return AuthConfig.errorMessages.weakPassword;
  }
  
  if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
    return AuthConfig.errorMessages.networkError;
  }
  
  if (message.includes('token') && (message.includes('expired') || message.includes('invalid'))) {
    return AuthConfig.errorMessages.tokenExpired;
  }
  
  if (message.includes('too many requests') || message.includes('rate limit')) {
    return 'Too many requests. Please wait a few minutes before trying again.';
  }
  
  if (message.includes('email delivery') || message.includes('email not sent')) {
    return 'Email delivery failed. Please check your email address and try again.';
  }
  
  // Return a sanitized version of the error message
  return error.message || AuthConfig.errorMessages.generic;
};