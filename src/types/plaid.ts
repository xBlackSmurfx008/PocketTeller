/**
 * Plaid type definitions
 * Proper types for Plaid Link integration
 */

/**
 * Plaid account information from metadata
 */
export interface PlaidAccount {
  id: string;
  name: string;
  mask: string | null;
  type: string;
  subtype: string | null;
  verification_status: string | null;
}

/**
 * Plaid institution information
 */
export interface PlaidInstitution {
  name: string;
  institution_id: string;
}

/**
 * Plaid Link onSuccess metadata
 */
export interface PlaidLinkOnSuccessMetadata {
  institution: PlaidInstitution;
  accounts: PlaidAccount[];
  link_session_id: string;
  transfer_status?: string;
}

/**
 * Plaid Link onExit metadata
 */
export interface PlaidLinkOnExitMetadata {
  institution: PlaidInstitution | null;
  status: string;
  link_session_id: string;
  request_id: string;
}

/**
 * Plaid Link error
 */
export interface PlaidLinkError {
  error_type: string;
  error_code: string;
  error_message: string;
  display_message: string | null;
}

/**
 * Plaid Link configuration
 */
export interface PlaidLinkConfig {
  token: string | null;
  onSuccess: (public_token: string, metadata: PlaidLinkOnSuccessMetadata) => void;
  onExit: (error: PlaidLinkError | null, metadata: PlaidLinkOnExitMetadata) => void;
  onEvent?: (eventName: string, metadata: Record<string, unknown>) => void;
}

/**
 * Plaid API response for link token
 */
export interface PlaidLinkTokenResponse {
  link_token: string;
  expiration: string;
  request_id: string;
}

/**
 * Plaid API response for token exchange
 */
export interface PlaidExchangeResponse {
  item_id: string;
  access_token: string;
  request_id: string;
}

/**
 * Plaid item status
 */
export interface PlaidItemStatus {
  item_id: string;
  institution_id: string;
  institution_name: string;
  webhook: string;
  error: PlaidLinkError | null;
  available_products: string[];
  billed_products: string[];
  consent_expiration_time: string | null;
}

/**
 * Plaid transaction
 */
export interface PlaidTransaction {
  transaction_id: string;
  account_id: string;
  amount: number;
  iso_currency_code: string;
  unofficial_currency_code: string | null;
  category: string[] | null;
  category_id: string | null;
  date: string;
  authorized_date: string | null;
  name: string;
  merchant_name: string | null;
  payment_channel: string;
  pending: boolean;
  pending_transaction_id: string | null;
  account_owner: string | null;
  location: PlaidLocation;
  payment_meta: PlaidPaymentMeta;
  transaction_type: string;
}

/**
 * Plaid location data
 */
export interface PlaidLocation {
  address: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  country: string | null;
  lat: number | null;
  lon: number | null;
  store_number: string | null;
}

/**
 * Plaid payment metadata
 */
export interface PlaidPaymentMeta {
  reference_number: string | null;
  ppd_id: string | null;
  payee: string | null;
  by_order_of: string | null;
  payer: string | null;
  payment_method: string | null;
  payment_processor: string | null;
  reason: string | null;
}

/**
 * Plaid account balance
 */
export interface PlaidAccountBalance {
  available: number | null;
  current: number;
  limit: number | null;
  iso_currency_code: string;
  unofficial_currency_code: string | null;
}

/**
 * Plaid account details
 */
export interface PlaidAccountDetails {
  account_id: string;
  balances: PlaidAccountBalance;
  mask: string | null;
  name: string;
  official_name: string | null;
  type: string;
  subtype: string | null;
}

