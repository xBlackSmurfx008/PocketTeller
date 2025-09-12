/**
 * Client-side rate limiting utility
 * Implements security measures to prevent abuse
 */

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  keyPrefix?: string;
}

interface RateLimitEntry {
  attempts: number;
  resetTime: number;
}

class RateLimiter {
  private storage: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.storage.entries()) {
      if (now > entry.resetTime) {
        this.storage.delete(key);
      }
    }
  }

  private getKey(identifier: string, action: string, prefix?: string): string {
    return `${prefix || 'rate_limit'}:${action}:${identifier}`;
  }

  check(identifier: string, action: string, config: RateLimitConfig): boolean {
    const key = this.getKey(identifier, action, config.keyPrefix);
    const now = Date.now();
    const entry = this.storage.get(key);

    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired one
      this.storage.set(key, {
        attempts: 1,
        resetTime: now + config.windowMs
      });
      return true;
    }

    if (entry.attempts >= config.maxAttempts) {
      return false; // Rate limit exceeded
    }

    // Increment attempts
    entry.attempts++;
    this.storage.set(key, entry);
    return true;
  }

  getRemaining(identifier: string, action: string, config: RateLimitConfig): number {
    const key = this.getKey(identifier, action, config.keyPrefix);
    const entry = this.storage.get(key);
    
    if (!entry || Date.now() > entry.resetTime) {
      return config.maxAttempts;
    }

    return Math.max(0, config.maxAttempts - entry.attempts);
  }

  getResetTime(identifier: string, action: string, config: RateLimitConfig): number | null {
    const key = this.getKey(identifier, action, config.keyPrefix);
    const entry = this.storage.get(key);
    
    if (!entry || Date.now() > entry.resetTime) {
      return null;
    }

    return entry.resetTime;
  }

  reset(identifier: string, action: string, prefix?: string): void {
    const key = this.getKey(identifier, action, prefix);
    this.storage.delete(key);
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.storage.clear();
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Pre-configured rate limiters for common actions
export const ContactFormLimiter = {
  check: (email: string) => rateLimiter.check(email, 'contact_form', {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    keyPrefix: 'contact'
  }),
  getRemaining: (email: string) => rateLimiter.getRemaining(email, 'contact_form', {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000
  })
};

export const WaitlistLimiter = {
  check: (email: string) => rateLimiter.check(email, 'waitlist_signup', {
    maxAttempts: 1,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    keyPrefix: 'waitlist'
  })
};

export const APIRequestLimiter = {
  check: (userId: string, endpoint: string) => rateLimiter.check(
    `${userId}:${endpoint}`, 
    'api_request', 
    {
      maxAttempts: 100,
      windowMs: 15 * 60 * 1000, // 15 minutes
      keyPrefix: 'api'
    }
  )
};

export const AuthLimiter = {
  check: (identifier: string) => rateLimiter.check(identifier, 'auth_attempt', {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    keyPrefix: 'auth'
  })
};

// Helper function to get client IP (best effort)
export const getClientIP = (): string => {
  // This is a simplified version - in production you'd want to handle
  // X-Forwarded-For headers, etc.
  return 'client_ip_placeholder';
};

// Rate limit decorator for functions
export function withRateLimit<T extends (...args: any[]) => any>(
  fn: T,
  identifier: (args: Parameters<T>) => string,
  config: RateLimitConfig
): T {
  return ((...args: Parameters<T>) => {
    const id = identifier(args);
    
    if (!rateLimiter.check(id, fn.name, config)) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    return fn(...args);
  }) as T;
}