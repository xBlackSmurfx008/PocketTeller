/**
 * Console cleanup utility - replaces console statements with structured logging
 * This runs in production to remove debug statements
 */

import { logger } from './logger';
import { Capacitor } from '@capacitor/core';

// Keep console logs enabled on native platforms for debugging
// Only disable in web production builds
const isNativePlatform = Capacitor.isNativePlatform();
const shouldDisableConsole = import.meta.env.PROD && !isNativePlatform;

// Disable console logging in production (but NOT on native mobile)
if (shouldDisableConsole) {
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
    // Filter out MetaMask extension errors
    if (event.reason?.message?.includes?.('MetaMask') || 
        event.reason?.stack?.includes?.('chrome-extension://')) {
      return;
    }
    
    logger.error('Unhandled promise rejection', { 
      reason: event.reason,
      url: window.location.href 
    });
  });

  window.addEventListener('error', (event) => {
    // Ignore generic "Script error" from cross-origin issues (not actionable)
    if (event.message === 'Script error.' && event.lineno === 0 && event.colno === 0 && !event.filename) {
      return;
    }
    
    logger.error('Global error handler', { 
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      url: window.location.href 
    });
  });
}