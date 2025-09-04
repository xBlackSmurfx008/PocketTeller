/**
 * Production-ready logging system
 * Replaces console.log statements with structured logging
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;
  private logBuffer: LogEntry[] = [];
  private maxBufferSize = 100;
  private sessionId = this.generateSessionId();

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>
  ): LogEntry {
    return {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) return true;
    
    // In production, only log warnings and errors
    return level === 'error' || level === 'warn';
  }

  private addToBuffer(entry: LogEntry): void {
    this.logBuffer.push(entry);
    
    // Keep buffer size manageable
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer = this.logBuffer.slice(-this.maxBufferSize);
    }
  }

  private async sendToRemoteLogger(entry: LogEntry): Promise<void> {
    // In production, send critical logs to remote service
    if (!this.isDevelopment && (entry.level === 'error' || entry.level === 'warn')) {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        
        await supabase.functions.invoke('log-collector', {
          body: {
            logs: [entry],
            userId: entry.userId,
            batchId: this.sessionId
          }
        });
      } catch (error) {
        // Fail silently to avoid infinite loops
        if (this.isDevelopment) {
          console.error('Remote logging failed:', error);
        }
      }
    }
  }

  error(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry('error', message, context);
    
    if (this.shouldLog('error')) {
      if (this.isDevelopment) {
        console.error(`[ERROR] ${message}`, context || '');
      }
      this.addToBuffer(entry);
      this.sendToRemoteLogger(entry);
    }
  }

  warn(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry('warn', message, context);
    
    if (this.shouldLog('warn')) {
      if (this.isDevelopment) {
        console.warn(`[WARN] ${message}`, context || '');
      }
      this.addToBuffer(entry);
      this.sendToRemoteLogger(entry);
    }
  }

  info(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry('info', message, context);
    
    if (this.shouldLog('info')) {
      if (this.isDevelopment) {
        console.info(`[INFO] ${message}`, context || '');
      }
      this.addToBuffer(entry);
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    const entry = this.createLogEntry('debug', message, context);
    
    if (this.shouldLog('debug')) {
      if (this.isDevelopment) {
        console.debug(`[DEBUG] ${message}`, context || '');
      }
      this.addToBuffer(entry);
    }
  }

  // Get recent logs for debugging
  getRecentLogs(count = 50): LogEntry[] {
    return this.logBuffer.slice(-count);
  }

  // Clear log buffer
  clearLogs(): void {
    this.logBuffer = [];
  }

  // Set user context for logs
  setUserContext(userId: string): void {
    this.logBuffer.forEach(entry => {
      entry.userId = userId;
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export types for use in other files
export type { LogEntry, LogLevel };
