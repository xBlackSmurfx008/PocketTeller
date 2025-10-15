/**
 * Production-safe logging utility
 * Provides structured logging with environment-aware behavior
 */

import { appConfig } from '@/config/environment';

/**
 * Log levels for categorizing messages
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Log context for additional metadata
 */
interface LogContext {
  [key: string]: unknown;
}

/**
 * Log entry structure
 */
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: Error;
}

/**
 * Logger configuration
 */
const config = {
  enabled: true,
  minLevel: appConfig.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO,
  includeTimestamp: true,
  includeContext: true,
};

/**
 * Formats a log entry for output
 */
function formatLogEntry(entry: LogEntry): string {
  const parts: string[] = [];
  
  if (config.includeTimestamp) {
    parts.push(`[${entry.timestamp}]`);
  }
  
  parts.push(`[${entry.level.toUpperCase()}]`);
  parts.push(entry.message);
  
  return parts.join(' ');
}

/**
 * Checks if a log level should be output
 */
function shouldLog(level: LogLevel): boolean {
  if (!config.enabled) return false;
  
  const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
  const minLevelIndex = levels.indexOf(config.minLevel);
  const currentLevelIndex = levels.indexOf(level);
  
  return currentLevelIndex >= minLevelIndex;
}

/**
 * Core logging function
 */
function log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
  if (!shouldLog(level)) return;
  
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
    error,
  };
  
  const formattedMessage = formatLogEntry(entry);
  
  // Output to console based on level
  switch (level) {
    case LogLevel.ERROR:
      if (error) {
        console.error(formattedMessage, error, context || {});
      } else {
        console.error(formattedMessage, context || {});
      }
      break;
    case LogLevel.WARN:
      console.warn(formattedMessage, context || {});
      break;
    case LogLevel.INFO:
      console.info(formattedMessage, context || {});
      break;
    case LogLevel.DEBUG:
      if (appConfig.isDevelopment) {
        console.log(formattedMessage, context || {});
      }
      break;
  }
  
  // In production, send to external service (e.g., Sentry, LogRocket)
  if (appConfig.isProduction && level === LogLevel.ERROR) {
    // TODO: Integrate with error tracking service
    // Example: Sentry.captureException(error || new Error(message), { extra: context });
  }
}

/**
 * Log a debug message (only in development)
 * @param message - Debug message
 * @param context - Optional context data
 */
export function logDebug(message: string, context?: LogContext): void {
  log(LogLevel.DEBUG, message, context);
}

/**
 * Log an info message
 * @param message - Info message
 * @param context - Optional context data
 */
export function logInfo(message: string, context?: LogContext): void {
  log(LogLevel.INFO, message, context);
}

/**
 * Log a warning message
 * @param message - Warning message
 * @param context - Optional context data
 */
export function logWarn(message: string, context?: LogContext): void {
  log(LogLevel.WARN, message, context);
}

/**
 * Log an error message
 * @param error - Error object or message
 * @param context - Optional context data
 * @param additionalMessage - Additional context message
 */
export function logError(
  error: Error | unknown | string,
  context?: string | LogContext,
  additionalMessage?: string
): void {
  let errorObj: Error | undefined;
  let contextObj: LogContext = {};
  let message: string;
  
  // Handle different parameter types for backward compatibility
  if (typeof context === 'string') {
    // Old signature: logError(error, 'contextString')
    message = context;
    contextObj = { originalContext: context };
    if (additionalMessage) {
      contextObj.additionalMessage = additionalMessage;
    }
  } else {
    // New signature: logError(error, { contextObj })
    message = additionalMessage || 'An error occurred';
    contextObj = context || {};
  }
  
  // Extract error object
  if (error instanceof Error) {
    errorObj = error;
    message = error.message || message;
  } else if (typeof error === 'string') {
    message = error;
  } else {
    contextObj.originalError = error;
  }
  
  log(LogLevel.ERROR, message, contextObj, errorObj);
}

/**
 * Group related log messages
 * @param label - Group label
 * @param callback - Function containing grouped logs
 */
export function logGroup(label: string, callback: () => void): void {
  if (appConfig.isDevelopment) {
    console.group(label);
    callback();
    console.groupEnd();
  } else {
    callback();
  }
}

/**
 * Log a table of data (development only)
 * @param data - Data to display as table
 */
export function logTable(data: unknown[]): void {
  if (appConfig.isDevelopment && console.table) {
    console.table(data);
  }
}

/**
 * Start a performance timer
 * @param label - Timer label
 */
export function startTimer(label: string): void {
  if (appConfig.isDevelopment && console.time) {
    console.time(label);
  }
}

/**
 * End a performance timer
 * @param label - Timer label
 */
export function endTimer(label: string): void {
  if (appConfig.isDevelopment && console.timeEnd) {
    console.timeEnd(label);
  }
}

/**
 * Assert a condition and log if false
 * @param condition - Condition to assert
 * @param message - Message to log if condition is false
 */
export function logAssert(condition: boolean, message: string): void {
  if (!condition) {
    logError(new Error(`Assertion failed: ${message}`));
  }
}

/**
 * Configure the logger
 * @param options - Logger configuration options
 */
export function configureLogger(options: Partial<typeof config>): void {
  Object.assign(config, options);
}

// Export default logger object
export const logger = {
  debug: logDebug,
  info: logInfo,
  warn: logWarn,
  error: logError,
  group: logGroup,
  table: logTable,
  startTimer,
  endTimer,
  assert: logAssert,
  configure: configureLogger,
};

export default logger;
