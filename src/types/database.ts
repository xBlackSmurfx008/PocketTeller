/**
 * Centralized TypeScript types to replace 'any' usage
 * Addresses critical type safety issues identified in audit
 */

// Budget related types
export interface BudgetData {
  id: string;
  user_id: string;
  income: number;
  expenses: number;
  categories: BudgetCategories;
  time_period: 'monthly' | 'weekly' | 'daily';
  status: 'active' | 'archived' | 'draft';
  created_at: string;
  updated_at: string;
}

export interface BudgetCategories {
  [category: string]: {
    planned: number;
    actual: number;
    limit?: number;
  };
}

/**
 * NOTE: Transaction type moved to @/types/models.ts
 * Import Transaction from models.ts for consistent Plaid integration
 */

// Goal types
export interface Goal {
  id: string;
  user_id: string;
  goal_name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  created_at: string;
  updated_at: string;
}

export interface GoalTask {
  id: string;
  goal_id: string;
  user_id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

// Account types
export interface Account {
  id: string;
  user_id: string;
  account_id: string;
  name: string;
  type: string;
  subtype?: string;
  balance: number;
  available_balance?: number;
  current_balance?: number;
  credit_limit?: number;
  currency_code: string;
  institution_name?: string;
  institution_id?: string;
  plaid_account_id?: string;
  plaid_item_id?: string;
  mask?: string;
  official_name?: string;
  source: 'manual' | 'plaid' | 'other';
  created_at: string;
  updated_at: string;
}

// User profile types
export interface UserProfile {
  id: string;
  user_id: string;
  app_id: string;
  accent_color: string;
  timezone?: string;
  has_connected_voice_ui: boolean;
  security_alerts_enabled: boolean;
  token_access_count: number;
  last_token_rotation?: string;
  last_suspicious_access_at?: string;
  created_at: string;
  updated_at: string;
}

// Bill types
export interface Bill {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  due_date: string;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
}

// Notification types
export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  in_app_enabled: boolean;
  bill_reminders: boolean;
  goal_progress_updates: boolean;
  budget_alerts: boolean;
  security_alerts: boolean;
  timezone?: string;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    message: string;
    code?: string;
  };
  success: boolean;
}

// Plaid related types
export interface PlaidItem {
  id: string;
  user_id: string;
  item_id: string;
  institution_id?: string;
  institution_name?: string;
  products: string[];
  billed_products: string[];
  available_products: string[];
  webhook?: string;
  consent_expiration_time?: string;
  update_type?: string;
  sync_cursor?: string;
  last_synced_at?: string;
  created_at: string;
  updated_at: string;
}

// Contact form types
export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  organization?: string;
  phone?: string;
  inquiry_type: string;
  subject?: string;
  message: string;
  status: 'pending' | 'reviewed' | 'responded' | 'closed';
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string;
}

// Financial insights types
export interface FinancialInsights {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  topCategories: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    income: number;
    expenses: number;
  }>;
  savingsRate: number;
  budgetVariance: number;
}

// Error types
export interface AppError {
  message: string;
  code?: string;
  details?: unknown;
  timestamp: string;
  userId?: string;
  context?: Record<string, unknown>;
}

// Chart data types
export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
  percentage?: number;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// Export utility types
export type DatabaseTables = 
  | 'accounts'
  | 'bills'
  | 'budget'
  | 'budget_shares'
  | 'contact_submissions'
  | 'conversation_threads'
  | 'conversations'
  | 'goal_tasks'
  | 'goals'
  | 'in_app_notifications'
  | 'notification_logs'
  | 'notification_preferences'
  | 'plaid_items'
  | 'plaid_token_audit_log'
  | 'profiles'
  | 'share_send_log'
  | 'site_metrics'
  | 'transactions'
  | 'user_memories'
  | 'waitlist_signups'
  | 'waitlist_email_log';

export type UserRole = 'user' | 'admin' | 'moderator';
export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentColor = 'violet' | 'blue' | 'emerald' | 'amber' | 'rose';