// Centralized auth configuration for consistent redirect URLs

export const getAuthRedirectUrl = (path: string = '') => {
  const baseUrl = window.location.origin;
  return `${baseUrl}${path}`;
};

export const AuthConfig = {
  // Email confirmation redirect
  emailConfirmRedirect: getAuthRedirectUrl('/confirm'),
  
  // Password reset redirect  
  passwordResetRedirect: getAuthRedirectUrl('/reset-password'),
  
  // Default post-auth redirect
  defaultRedirect: getAuthRedirectUrl('/'),
  
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
  
  if (message.includes('email not confirmed')) {
    return AuthConfig.errorMessages.emailNotConfirmed;
  }
  
  if (message.includes('invalid login credentials') || message.includes('invalid email or password')) {
    return AuthConfig.errorMessages.invalidCredentials;
  }
  
  if (message.includes('user already registered') || message.includes('already registered')) {
    return AuthConfig.errorMessages.userAlreadyExists;
  }
  
  if (message.includes('password') && (message.includes('weak') || message.includes('short'))) {
    return AuthConfig.errorMessages.weakPassword;
  }
  
  if (message.includes('network') || message.includes('fetch')) {
    return AuthConfig.errorMessages.networkError;
  }
  
  if (message.includes('token') && (message.includes('expired') || message.includes('invalid'))) {
    return AuthConfig.errorMessages.tokenExpired;
  }
  
  // Return the original error message if no match found
  return error.message;
};