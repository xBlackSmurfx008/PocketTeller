/**
 * Shared TypeScript types for Plaid integration
 */

export interface PlaidConfig {
  clientId: string;
  secret: string;
  env: string;
  encryptionKey: string;
  baseUrl: string;
}

export interface PlaidLinkExchangeRequest {
  public_token: string;
  institution_name?: string;
  institution_id?: string;
}

export interface PlaidAccount {
  account_id: string;
  name: string;
  official_name?: string;
  type: string;
  subtype?: string;
  mask?: string;
  balances: {
    available: number | null;
    current: number | null;
    limit: number | null;
    iso_currency_code: string;
  };
}

export interface PlaidTransaction {
  transaction_id: string;
  account_id: string;
  amount: number;
  date: string;
  datetime?: string;
  authorized_date?: string;
  authorized_datetime?: string;
  name: string;
  merchant_name?: string;
  category?: string[];
  pending: boolean;
  iso_currency_code?: string;
  unofficial_currency_code?: string;
  location?: any;
  payment_meta?: any;
}

export interface PlaidItem {
  item_id: string;
  institution_id?: string;
  webhook?: string;
  available_products?: string[];
  billed_products?: string[];
  products?: string[];
  consent_expiration_time?: string;
  update_type?: string;
}

export interface DatabaseAccount {
  user_id: string;
  plaid_account_id: string;
  plaid_item_id: string;
  plaid_item_id_ref: string;
  account_id: string;
  name: string;
  official_name: string;
  type: string;
  subtype?: string;
  mask?: string;
  available_balance?: number;
  current_balance: number;
  balance: number;
  credit_limit?: number;
  currency_code: string;
  institution_id?: string;
  institution_name: string;
  source: 'plaid' | 'manual';
}

export interface DatabaseTransaction {
  user_id: string;
  plaid_transaction_id: string;
  plaid_account_id: string;
  transaction_id: string;
  amount: number;
  date: string;
  datetime?: string;
  authorized_date?: string;
  authorized_datetime?: string;
  description: string;
  merchant_name?: string;
  category: string;
  category_source: 'user' | 'plaid' | 'ai' | 'auto';
  subcategory?: string;
  pending: boolean;
  iso_currency_code: string;
  unofficial_currency_code?: string;
  location?: any;
  payment_meta?: any;
  plaid_category?: string;
}

export interface PlaidItemRecord {
  user_id: string;
  item_id: string;
  institution_id?: string;
  institution_name?: string;
  available_products: string[];
  billed_products: string[];
  products: string[];
  sync_cursor?: string;
  last_synced_at?: string;
  update_type?: string;
}

export interface AuditLogEntry {
  user_id: string;
  access_type: string;
  function_name: string;
  ip_address: string | null;
  user_agent: string;
  success: boolean;
  error_message?: string;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMinutes: number;
  errorMessage: string;
}

export const RATE_LIMITS: { [key: string]: RateLimitConfig } = {
  link_token: {
    maxRequests: 50,
    windowMinutes: 60,
    errorMessage: 'Too many link token requests. Please try again in a few minutes.',
  },
  token_access: {
    maxRequests: 100,
    windowMinutes: 60,
    errorMessage: 'Too many token access attempts. Please try again later.',
  },
};

