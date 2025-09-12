/**
 * Environment configuration for PocketTeller
 * Centralized configuration management for the application
 */

// Environment detection
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;
const isTest = import.meta.env.MODE === 'test';

// App configuration
export const appConfig = {
  name: 'PocketTeller',
  version: '1.0.0',
  environment: isDevelopment ? 'development' : isProduction ? 'production' : 'test',
  isDevelopment,
  isProduction,
  isTest,
};

// Feature flags
export const features = {
  enableAnalytics: isProduction,
  enableErrorReporting: isProduction,
  enableDebugMode: isDevelopment,
  enableMockData: isDevelopment || isTest,
  enablePerformanceMonitoring: isProduction,
};

// SEO and metadata configuration
export const metaConfig = {
  title: 'PocketTeller - Smart Personal Finance Management',
  description: 'AI-powered personal finance app that helps you budget, track expenses, and achieve your financial goals with intelligent insights and automation.',
  keywords: 'personal finance, budgeting, expense tracking, financial goals, AI finance, money management, financial planning',
  author: 'PocketTeller Team',
  ogImage: '/og-image.png',
  twitterHandle: '@pocketteller',
  
  // Canonical URL helper
  canonical: (path: string = '') => {
    const baseUrl = isProduction 
      ? 'https://pocketteller.app' 
      : 'http://localhost:5173';
    return `${baseUrl}${path}`;
  },
  
  // Social media URLs
  social: {
    twitter: 'https://twitter.com/pocketteller',
    linkedin: 'https://linkedin.com/company/pocketteller',
    github: 'https://github.com/pocketteller',
  },
};

// API configuration
export const apiConfig = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
  },
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
};

// Analytics configuration
export const analyticsConfig = {
  enabled: features.enableAnalytics,
  trackingId: import.meta.env.VITE_GA_TRACKING_ID || '',
  debug: features.enableDebugMode,
};

// Error reporting configuration
export const errorConfig = {
  enabled: features.enableErrorReporting,
  dsn: import.meta.env.VITE_SENTRY_DSN || '',
  environment: appConfig.environment,
  debug: features.enableDebugMode,
};

// Performance monitoring
export const performanceConfig = {
  enabled: features.enablePerformanceMonitoring,
  sampleRate: isProduction ? 0.1 : 1.0, // 10% in production, 100% in development
};

// Validation helpers
export const validateConfig = () => {
  const errors: string[] = [];
  
  if (!apiConfig.supabase.url) {
    errors.push('VITE_SUPABASE_URL is required');
  }
  
  if (!apiConfig.supabase.anonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY is required');
  }
  
  if (errors.length > 0) {
    console.error('Configuration validation failed:', errors);
    if (isProduction) {
      throw new Error(`Configuration errors: ${errors.join(', ')}`);
    }
  }
  
  return errors.length === 0;
};

// Export main config object for backward compatibility
export const config = {
  app: appConfig,
  features,
  meta: metaConfig,
  api: apiConfig,
  analytics: analyticsConfig,
  error: errorConfig,
  performance: performanceConfig,
  validate: validateConfig,
};

// Validate configuration on import (in production)
if (isProduction) {
  validateConfig();
}

// Default export
export default config;