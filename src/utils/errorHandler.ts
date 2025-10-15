/**
 * Standardized error handling utilities
 * Provides consistent error processing across the application
 */

import { ApiError, SupabaseError } from '@/types/api';

/**
 * Converts various error types to a standardized ApiError format
 * @param error - The error to convert (can be Error, SupabaseError, or unknown)
 * @param context - Optional context string for debugging
 * @returns Standardized ApiError object
 */
export function normalizeError(error: unknown, context?: string): ApiError {
  // Handle Error instances
  if (error instanceof Error) {
    return {
      message: error.message,
      details: {
        context,
        name: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    };
  }

  // Handle Supabase errors
  if (isSupabaseError(error)) {
    return {
      message: error.message,
      code: error.code,
      details: {
        context,
        hint: error.hint,
        details: error.details
      }
    };
  }

  // Handle plain objects with message property
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return {
      message: String((error as { message: unknown }).message),
      details: { context, originalError: error }
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      message: error,
      details: { context }
    };
  }

  // Fallback for unknown error types
  return {
    message: 'An unexpected error occurred',
    details: {
      context,
      originalError: String(error)
    }
  };
}

/**
 * Type guard to check if an error is a Supabase error
 */
function isSupabaseError(error: unknown): error is SupabaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as SupabaseError).message === 'string'
  );
}

/**
 * Logs an error with consistent formatting
 * @param error - The error to log
 * @param context - Context where the error occurred
 * @param level - Log level (error, warn, info)
 */
export function logError(
  error: unknown,
  context: string,
  level: 'error' | 'warn' | 'info' = 'error'
): void {
  const normalizedError = normalizeError(error, context);
  
  const logMessage = `[${context}] ${normalizedError.message}`;
  const logData = {
    ...normalizedError,
    timestamp: new Date().toISOString()
  };

  switch (level) {
    case 'error':
      console.error(logMessage, logData);
      break;
    case 'warn':
      console.warn(logMessage, logData);
      break;
    case 'info':
      console.info(logMessage, logData);
      break;
  }
}

/**
 * Creates a user-friendly error message from an error object
 * @param error - The error to format
 * @param fallbackMessage - Fallback message if error has no message
 * @returns User-friendly error message string
 */
export function getUserErrorMessage(
  error: unknown,
  fallbackMessage = 'Something went wrong. Please try again.'
): string {
  const normalized = normalizeError(error);
  
  // Map common error codes to user-friendly messages
  if (normalized.code) {
    const errorMessages: Record<string, string> = {
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/weak-password': 'Password is too weak. Please use a stronger password.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'PGRST116': 'No data found.',
      '23505': 'This record already exists.',
      '23503': 'Cannot delete this item as it is being used elsewhere.',
      '42P01': 'Database table not found. Please contact support.',
    };

    if (errorMessages[normalized.code]) {
      return errorMessages[normalized.code];
    }
  }

  // Return the error message if it looks user-friendly
  if (normalized.message && normalized.message.length < 150) {
    return normalized.message;
  }

  return fallbackMessage;
}

/**
 * Retry an async operation with exponential backoff
 * @param operation - The async operation to retry
 * @param maxRetries - Maximum number of retry attempts
 * @param baseDelay - Base delay in milliseconds (will be multiplied for each retry)
 * @returns Promise resolving to the operation result
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        logError(error, `Retry attempt ${attempt + 1}/${maxRetries}`, 'warn');
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Wraps an async function with error handling
 * @param fn - The async function to wrap
 * @param context - Context for error logging
 * @returns Wrapped function that returns [data, error] tuple
 */
export function withErrorHandling<TArgs extends unknown[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  context: string
) {
  return async (...args: TArgs): Promise<[TReturn | null, ApiError | null]> => {
    try {
      const result = await fn(...args);
      return [result, null];
    } catch (error) {
      const normalizedError = normalizeError(error, context);
      logError(error, context);
      return [null, normalizedError];
    }
  };
}

/**
 * Type guard to check if a value is an ApiError
 */
export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof (value as ApiError).message === 'string'
  );
}

