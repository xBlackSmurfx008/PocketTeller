// API Response Types
// Standardized API response and error handling types

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = unknown> {
  data: T | null;
  error: ApiError | null;
}

/**
 * Standard API error structure
 */
export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}

/**
 * Supabase error response
 */
export interface SupabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}

/**
 * Password validation response
 */
export interface PasswordValidation {
  valid: boolean;
  errors: string[];
  strength_score?: number;
}

/**
 * Authentication error types
 */
export type AuthErrorType = 
  | 'rate_limit'
  | 'already_confirmed'
  | 'delivery_failed'
  | 'invalid_credentials'
  | 'unknown'
  | null;

/**
 * Auth operation response
 */
export interface AuthResponse {
  error: SupabaseError | null;
  errorType?: AuthErrorType;
  passwordValidation?: PasswordValidation;
  user?: unknown; // Supabase User object - use proper Supabase types when importing
  session?: unknown; // Supabase Session object - use proper Supabase types when importing
}

/**
 * Plaid Link token response
 */
export interface PlaidLinkResponse {
  link_token: string;
  expiration: string;
  request_id: string;
}

/**
 * Plaid exchange response
 */
export interface PlaidExchangeResponse {
  access_token: string;
  item_id: string;
  request_id: string;
}

/**
 * AI Chat message
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

/**
 * AI Chat thread
 */
export interface ChatThread {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

/**
 * Subscription tier
 */
export type SubscriptionTier = 'free' | 'pro' | 'premium';

/**
 * Subscription status
 */
export interface SubscriptionStatus {
  tier: SubscriptionTier;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_end?: string;
  cancel_at_period_end: boolean;
}

/**
 * Stripe checkout session response
 */
export interface StripeCheckoutResponse {
  sessionId: string;
  url: string;
}

/**
 * File upload response
 */
export interface FileUploadResponse {
  url: string;
  path: string;
  size: number;
  type: string;
}

/**
 * Budget sharing token
 */
export interface ShareBudgetResponse {
  token: string;
  expires_at: string;
  share_url: string;
}

/**
 * Notification preferences
 */
export interface NotificationPreferences {
  email_enabled: boolean;
  push_enabled: boolean;
  budget_alerts: boolean;
  goal_reminders: boolean;
  bill_reminders: boolean;
  spending_alerts: boolean;
}

/**
 * Generic database query response
 */
export interface QueryResponse<T> {
  data: T | null;
  error: SupabaseError | null;
  count?: number;
}

/**
 * Pagination params
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
}

