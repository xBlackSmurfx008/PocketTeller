/**
 * Shared Plaid utilities for all Edge Functions
 * Provides consistent error handling, logging, and API interactions
 */

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const PLAID_ENVIRONMENTS = {
  sandbox: 'https://sandbox.plaid.com',
  development: 'https://development.plaid.com',
  production: 'https://production.plaid.com',
} as const;

export type PlaidEnvironment = keyof typeof PLAID_ENVIRONMENTS;

/**
 * Get Plaid base URL from environment variable
 * Supports: 'sandbox', 'development', 'production', or full HTTPS URL
 */
export function getPlaidBaseUrl(env: string): string | null {
  // Sanitize input: trim whitespace and remove quotes
  const sanitized = env.trim().replace(/^["']|["']$/g, '');
  
  console.log('Plaid environment:', {
    original: env,
    sanitized,
  });
  
  // If it's already a full URL, normalize it
  if (sanitized.includes('://')) {
    let normalizedUrl = sanitized.startsWith('https://') 
      ? sanitized 
      : sanitized.replace(/^https?:\/\//, 'https://');
    
    normalizedUrl = normalizedUrl.replace(/\/$/, '');
    return normalizedUrl;
  }
  
  // Map short names to URLs
  const mappedUrl = PLAID_ENVIRONMENTS[sanitized.toLowerCase() as PlaidEnvironment];
  
  if (!mappedUrl) {
    console.error('Invalid Plaid environment:', sanitized);
    return null;
  }
  
  return mappedUrl;
}

/**
 * Safely parse client IP from request headers
 * Returns null if IP format is invalid
 */
export function getClientIP(req: Request): string | null {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const clientIP = forwardedFor 
    ? forwardedFor.split(',')[0].trim() 
    : req.headers.get('x-real-ip');
  
  // Validate IP format
  if (clientIP && (
    /^(\d{1,3}\.){3}\d{1,3}$/.test(clientIP) ||  // IPv4
    /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(clientIP) // IPv6
  )) {
    return clientIP;
  }
  
  return null;
}

/**
 * Validate required Plaid configuration
 * Throws error if any required values are missing
 */
export function validatePlaidConfig(config: {
  clientId?: string;
  secret?: string;
  env?: string;
  encryptionKey?: string;
}): void {
  const missing: string[] = [];
  
  if (!config.clientId) missing.push('PLAID_CLIENT_ID');
  if (!config.secret) missing.push('PLAID_SECRET');
  if (!config.env) missing.push('PLAID_ENV');
  
  if (missing.length > 0) {
    throw new Error(`Missing required Plaid configuration: ${missing.join(', ')}`);
  }
}

/**
 * Create standardized error response
 */
export function errorResponse(
  message: string,
  status: number = 500,
  details?: any
): Response {
  const body = details 
    ? { error: message, details }
    : { error: message };
    
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

/**
 * Create standardized success response
 */
export function successResponse(data: any, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

/**
 * Map Plaid categories to app categories
 */
export function mapPlaidCategory(plaidCategories: string[]): string {
  if (!plaidCategories || plaidCategories.length === 0) {
    return 'Other';
  }

  const primary = plaidCategories[0]?.toLowerCase() || '';
  
  const categoryMap: { [key: string]: string } = {
    'food and drink': 'Food & Dining',
    'restaurants': 'Food & Dining',
    'fast food': 'Food & Dining',
    'coffee shops': 'Food & Dining',
    'groceries': 'Food & Dining',
    'food': 'Food & Dining',
    
    'transportation': 'Transportation',
    'gas stations': 'Transportation',
    'parking': 'Transportation',
    'public transportation': 'Transportation',
    'taxi': 'Transportation',
    'car service': 'Transportation',
    'travel': 'Transportation',
    
    'shops': 'Shopping',
    'general merchandise': 'Shopping',
    'clothing and accessories': 'Shopping',
    'electronics': 'Shopping',
    'home improvement': 'Shopping',
    'retail': 'Shopping',
    
    'recreation': 'Entertainment',
    'entertainment': 'Entertainment',
    'arts and entertainment': 'Entertainment',
    'gyms and fitness centers': 'Entertainment',
    'sports': 'Entertainment',
    
    'service': 'Bills & Utilities',
    'utilities': 'Bills & Utilities',
    'telecommunication services': 'Bills & Utilities',
    'internet and cable': 'Bills & Utilities',
    'phone': 'Bills & Utilities',
    'bills': 'Bills & Utilities',
    
    'healthcare': 'Healthcare',
    'medical': 'Healthcare',
    'dentists': 'Healthcare',
    'hospitals': 'Healthcare',
    
    'airlines and aviation services': 'Travel',
    'lodging': 'Travel',
    'car rental': 'Travel',
    'hotels': 'Travel',
    
    'payment': 'Income',
    'payroll': 'Income',
    'deposit': 'Income',
    'transfer in': 'Income',
    'interest': 'Income',
    'dividend': 'Income',
    
    'bank fees': 'Bills & Utilities',
    'overdraft': 'Bills & Utilities',
  };

  // Check for matches in primary category
  for (const [plaidCat, appCat] of Object.entries(categoryMap)) {
    if (primary.includes(plaidCat)) {
      return appCat;
    }
  }

  // Check subcategory if available
  if (plaidCategories.length > 1) {
    const subcategory = plaidCategories[1]?.toLowerCase() || '';
    for (const [plaidCat, appCat] of Object.entries(categoryMap)) {
      if (subcategory.includes(plaidCat)) {
        return appCat;
      }
    }
  }

  return 'Other';
}

/**
 * Logger with consistent formatting
 */
export const logger = {
  info: (message: string, data?: any) => {
    console.log(`ℹ️  ${message}`, data || '');
  },
  error: (message: string, error?: any) => {
    console.error(`❌ ${message}`, error || '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`⚠️  ${message}`, data || '');
  },
  success: (message: string, data?: any) => {
    console.log(`✅ ${message}`, data || '');
  },
};

/**
 * Plaid API client wrapper
 */
export class PlaidAPIClient {
  constructor(
    private baseUrl: string,
    private clientId: string,
    private secret: string
  ) {}

  /**
   * Make authenticated request to Plaid API
   */
  async request(endpoint: string, body: any): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    logger.info(`Plaid API request: ${endpoint}`);
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: this.clientId,
          secret: this.secret,
          ...body,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error(`Plaid API error: ${endpoint}`, {
          status: response.status,
          error: data,
        });
        throw new Error(data.error_message || 'Plaid API request failed');
      }

      logger.success(`Plaid API success: ${endpoint}`);
      return data;
    } catch (error) {
      logger.error(`Plaid API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * Create link token
   */
  async createLinkToken(userId: string): Promise<string> {
    const data = await this.request('/link/token/create', {
      user: { client_user_id: userId },
      client_name: 'Pocket Banker',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en',
    });
    
    return data.link_token;
  }

  /**
   * Exchange public token for access token
   */
  async exchangePublicToken(publicToken: string): Promise<{
    access_token: string;
    item_id: string;
  }> {
    return await this.request('/item/public_token/exchange', {
      public_token: publicToken,
    });
  }

  /**
   * Get accounts
   */
  async getAccounts(accessToken: string): Promise<any> {
    return await this.request('/accounts/get', {
      access_token: accessToken,
    });
  }

  /**
   * Sync transactions
   */
  async syncTransactions(accessToken: string, cursor?: string): Promise<any> {
    return await this.request('/transactions/sync', {
      access_token: accessToken,
      cursor,
      count: 100,
    });
  }

  /**
   * Get transactions (legacy)
   */
  async getTransactions(
    accessToken: string,
    startDate: string,
    endDate: string
  ): Promise<any> {
    return await this.request('/transactions/get', {
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
      options: { count: 100 },
    });
  }

  /**
   * Remove item
   */
  async removeItem(accessToken: string): Promise<void> {
    await this.request('/item/remove', {
      access_token: accessToken,
    });
  }
}

