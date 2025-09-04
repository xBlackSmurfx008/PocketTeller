import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface ErrorInfo {
  error: Error;
  errorInfo?: React.ErrorInfo;
  timestamp: Date;
  userId?: string;
  url?: string;
}

export function useErrorBoundary() {
  const [errors, setErrors] = useState<ErrorInfo[]>([]);

  const logError = useCallback((error: Error, errorInfo?: React.ErrorInfo, userId?: string) => {
    const errorData: ErrorInfo = {
      error,
      errorInfo,
      timestamp: new Date(),
      userId,
      url: window.location.href
    };

    setErrors(prev => [...prev.slice(-9), errorData]); // Keep last 10 errors

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error boundary caught error:', error);
      console.error('Error info:', errorInfo);
    }

    // Show user-friendly error message
    toast.error('Something went wrong. Our team has been notified.');

    // In production, you might want to send this to an error reporting service
    // like Sentry, LogRocket, or a custom endpoint
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  return { errors, logError, clearErrors };
}