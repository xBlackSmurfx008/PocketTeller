/**
 * Centralized environment configuration
 * Replaces hardcoded URLs and provides type-safe config
 */

interface AppConfig {
  supabase: {
    url: string;
    anonKey: string;
    functionsUrl: string;
  };
  app: {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
    baseUrl: string;
  };
  features: {
    enableAnalytics: boolean;
    enableErrorReporting: boolean;
    enableDevMode: boolean;
  };
  api: {
    timeout: number;
    retries: number;
  };
}

// Type-safe environment variable access
const getEnvVar = (key: string, fallback?: string): string => {
  const value = import.meta.env[key] || fallback;
  if (!value) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value;
};

const getOptionalEnvVar = (key: string, fallback: string): string => {
  return import.meta.env[key] || fallback;
};

const getBooleanEnvVar = (key: string, fallback: boolean): boolean => {
  const value = import.meta.env[key];
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
};

// Centralized configuration
export const config: AppConfig = {
  supabase: {
    url: 'https://dscndbpqvhvylukvcgpq.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzY25kYnBxdmh2eWx1a3ZjZ3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4Mjg1NzksImV4cCI6MjA3MTQwNDU3OX0.GYh0VhUqTpVfwG2mh8WwW8GSBJPvpFAZSFJy7oWbnL0',
    functionsUrl: 'https://dscndbpqvhvylukvcgpq.supabase.co/functions/v1',
  },
  app: {
    name: 'Pocket Banker',
    version: '1.0.0',
    environment: import.meta.env.DEV ? 'development' : 'production',
    baseUrl: getOptionalEnvVar('VITE_APP_BASE_URL', 'https://pocketbanker.ai'),
  },
  features: {
    enableAnalytics: getBooleanEnvVar('VITE_ENABLE_ANALYTICS', true),
    enableErrorReporting: getBooleanEnvVar('VITE_ENABLE_ERROR_REPORTING', true),
    enableDevMode: import.meta.env.DEV,
  },
  api: {
    timeout: 30000, // 30 seconds
    retries: 3,
  },
};

// Validate critical configuration
if (!config.supabase.url || !config.supabase.anonKey) {
  throw new Error('Supabase configuration is incomplete');
}

// Export individual configs for convenience
export const supabaseConfig = config.supabase;
export const appConfig = config.app;
export const featureConfig = config.features;
export const apiConfig = config.api;

// Helper functions
export const isDevelopment = config.app.environment === 'development';
export const isProduction = config.app.environment === 'production';
export const isStaging = config.app.environment === 'staging';

// API endpoints builder
export const buildApiUrl = (endpoint: string): string => {
  return `${config.supabase.functionsUrl}/${endpoint}`;
};

// Meta information for SEO
export const metaConfig = {
  title: 'Pocket Banker - AI-Powered Personal Finance Management',
  description: 'Transform your financial future with AI-powered budgeting, smart transaction tracking, and personalized financial insights.',
  keywords: 'personal finance, budgeting, AI finance, financial planning, expense tracking',
  ogImage: `${config.app.baseUrl}/og-image.png`,
  twitterHandle: '@pocketbanker',
  canonical: (path: string) => `${config.app.baseUrl}${path}`,
};