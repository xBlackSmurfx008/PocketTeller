/**
 * Console cleanup utility - replaces console statements with structured logging
 * This runs in production to remove debug statements
 */

import { logger } from './logger';

// Disable console logging in production
if (import.meta.env.PROD) {
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
    debug: console.debug
  };

  console.log = (...args: any[]) => {
    // Silent in production, or log to structured logger if important
    if (args[0] && typeof args[0] === 'string' && args[0].includes('ERROR')) {
      logger.error('Console log error', { message: args.join(' ') });
    }
  };

  console.warn = (...args: any[]) => {
    logger.warn('Console warning', { message: args.join(' ') });
  };

  console.error = (...args: any[]) => {
    logger.error('Console error', { message: args.join(' ') });
  };

  console.info = () => {
    // Silent in production - info logs are too verbose
  };

  console.debug = () => {
    // Silent in production - debug logs are too verbose
  };
}

// Initialize logger with user context when available
if (typeof window !== 'undefined') {
  // Set up global error handler
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', { 
      reason: event.reason,
      url: window.location.href 
    });
  });

  window.addEventListener('error', (event) => {
    logger.error('Global error handler', { 
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      url: window.location.href 
    });
  });
}