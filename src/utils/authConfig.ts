// Centralized auth configuration for consistent redirect URLs

export const getAuthRedirectUrl = (path: string = '') => {
  // Always use app subdomain for auth flows and application features
  const baseUrl = 'https://app.pocketbanker.app';
  return `${baseUrl}${path}`;
};

export const getWebsiteUrl = (path: string = '') => {
  // Use main domain for marketing/website pages
  const baseUrl = 'https://pocketbanker.app';
  return `${baseUrl}${path}`;
};

export const AuthConfig = {
  // Email confirmation redirect
  emailConfirmRedirect: getAuthRedirectUrl('/confirm'),
  
  // Password reset redirect  
  passwordResetRedirect: getAuthRedirectUrl('/reset-password'),
  
  // Default post-auth redirect
  defaultRedirect: getAuthRedirectUrl('/budget'),
  
  // Error messages
  errorMessages: {
    emailNotConfirmed: 'Please check your email and click the confirmation link to activate your account.',
    invalidCredentials: 'Invalid email or password. Please check your credentials and try again.',
    userAlreadyExists: 'An account with this email already exists. Try signing in instead.',
    weakPassword: 'Password should be at least 6 characters long.',
    networkError: 'Network error. Please check your connection and try again.',
    tokenExpired: 'The verification link has expired. Please request a new one.',
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