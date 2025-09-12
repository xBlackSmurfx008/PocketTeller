import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '@/utils/logger';

// Mock console methods
const originalConsole = {
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug
};

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    logger.clearLogs();
    
    // Mock console methods
    console.error = vi.fn();
    console.warn = vi.fn();
    console.info = vi.fn();
    console.debug = vi.fn();
  });

  afterEach(() => {
    // Restore console methods
    Object.assign(console, originalConsole);
  });

  it('logs error messages in development', () => {
    logger.error('Test error', { code: 'TEST_ERROR' });
    
    expect(console.error).toHaveBeenCalledWith(
      '[ERROR] Test error',
      { code: 'TEST_ERROR' }
    );
  });

  it('logs warning messages in development', () => {
    logger.warn('Test warning', { source: 'test' });
    
    expect(console.warn).toHaveBeenCalledWith(
      '[WARN] Test warning',
      { source: 'test' }
    );
  });

  it('stores logs in buffer', () => {
    logger.error('Test error 1');
    logger.warn('Test warning 1');
    logger.info('Test info 1');
    
    const recentLogs = logger.getRecentLogs(5);
    
    expect(recentLogs).toHaveLength(3);
    expect(recentLogs[0].level).toBe('error');
    expect(recentLogs[0].message).toBe('Test error 1');
    expect(recentLogs[1].level).toBe('warn');
    expect(recentLogs[2].level).toBe('info');
  });

  it('clears logs when requested', () => {
    logger.error('Test error');
    logger.warn('Test warning');
    
    expect(logger.getRecentLogs()).toHaveLength(2);
    
    logger.clearLogs();
    
    expect(logger.getRecentLogs()).toHaveLength(0);
  });

  it('includes timestamp and session info in log entries', () => {
    logger.error('Test error');
    
    const logs = logger.getRecentLogs(1);
    const logEntry = logs[0];
    
    expect(logEntry.timestamp).toBeDefined();
    expect(logEntry.sessionId).toBeDefined();
    expect(logEntry.level).toBe('error');
    expect(logEntry.message).toBe('Test error');
  });

  it('sets user context for logs', () => {
    const userId = 'test-user-123';
    logger.setUserContext(userId);
    logger.error('Test error');
    
    const logs = logger.getRecentLogs(1);
    expect(logs[0].userId).toBe(userId);
  });
});