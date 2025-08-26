import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const plaidClientId = Deno.env.get('PLAID_CLIENT_ID')!;
const plaidSecret = Deno.env.get('PLAID_SECRET')!;
const plaidEnv = Deno.env.get('PLAID_ENV') || 'sandbox';

// Normalize and sanitize PLAID_ENV to base URL
const getPlaidBaseUrl = (env: string) => {
  // Sanitize input: trim whitespace and remove quotes
  const sanitized = env.trim().replace(/^["']|["']$/g, '');
  
  console.log('Original PLAID_ENV:', env);
  console.log('Sanitized PLAID_ENV:', sanitized);
  
  // If it's already a full URL, normalize it
  if (sanitized.includes('://')) {
    // Ensure it starts with https://
    let normalizedUrl = sanitized.startsWith('https://') 
      ? sanitized 
      : sanitized.replace(/^https?:\/\//, 'https://');
    
    // Remove trailing slash
    normalizedUrl = normalizedUrl.replace(/\/$/, '');
    
    console.log('Normalized URL:', normalizedUrl);
    return normalizedUrl;
  }
  
  // Environment URL mapping for short names
  const envMap: { [key: string]: string } = {
    sandbox: 'https://sandbox.plaid.com',
    development: 'https://development.plaid.com', 
    production: 'https://production.plaid.com'
  };
  
  const mappedUrl = envMap[sanitized.toLowerCase()];
  console.log('Mapped URL for', sanitized, ':', mappedUrl);
  
  return mappedUrl || null;
};

// Safely parse client IP from headers
const getClientIP = (req: Request): string | null => {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const clientIP = forwardedFor ? forwardedFor.split(',')[0].trim() : 
                   req.headers.get('x-real-ip');
  
  // Validate that it's a valid IP format before returning
  if (clientIP && (
    /^(\d{1,3}\.){3}\d{1,3}$/.test(clientIP) ||  // IPv4
    /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(clientIP) // Basic IPv6 check
  )) {
    return clientIP;
  }
  
  return null;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate secrets
    if (!plaidClientId || !plaidSecret) {
      console.error('Missing required Plaid configuration');
      return new Response(JSON.stringify({ 
        error: 'Plaid configuration incomplete. Please check your secrets.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate and normalize environment
    const plaidBaseUrl = getPlaidBaseUrl(plaidEnv);
    console.log('Final Plaid base URL:', plaidBaseUrl);
    
    if (!plaidBaseUrl) {
      console.error('Failed to determine Plaid base URL from PLAID_ENV:', plaidEnv);
      return new Response(JSON.stringify({ 
        error: `Invalid Plaid environment configuration. Got: "${plaidEnv}". Use "sandbox", "development", "production", or a full HTTPS URL.`,
        debug: {
          original_env: plaidEnv,
          sanitized_env: plaidEnv.trim().replace(/^["']|["']$/g, '')
        }
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid auth token');
    }

    // Get user's encrypted access token
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('encrypted_plaid_token, token_iv')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile?.encrypted_plaid_token) {
      throw new Error('No Plaid access token found');
    }

    // Check rate limiting before proceeding
    const { data: rateLimitCheck, error: rateLimitError } = await supabase
      .rpc('check_token_access_rate', { target_user_id: user.id });

    if (rateLimitError || !rateLimitCheck) {
      console.error('Rate limit exceeded for user:', user.id);
      throw new Error('Too many token access attempts. Please try again later.');
    }

    // Set user context for audit logging
    await supabase.rpc('set_config', {
      parameter: 'app.current_user_id',
      value: user.id
    });

    // Get client IP and User-Agent for audit logging
    const clientIP = getClientIP(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Get encryption key
    const encryptionKey = Deno.env.get('PLAID_ENCRYPTION_KEY');
    if (!encryptionKey) {
      throw new Error('Encryption key not configured');
    }

    // Decrypt the access token with audit logging
    const { data: decryptedToken, error: decryptError } = await supabase
      .rpc('decrypt_plaid_token_with_audit', {
        encrypted_data: {
          encrypted_token: profile.encrypted_plaid_token,
          iv: profile.token_iv
        },
        encryption_key: encryptionKey,
        function_name: 'plaid-sync',
        ip_address: clientIP,
        user_agent: userAgent,
        target_user_id: user.id
      });

    if (decryptError || !decryptedToken) {
      console.error('Token decryption failed:', decryptError);
      throw new Error('Failed to decrypt token');
    }

    // Get accounts from Plaid
    const accountsResponse = await fetch(`${plaidBaseUrl}/accounts/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: plaidClientId,
        secret: plaidSecret,
        access_token: decryptedToken,
      }),
    });

    const accountsData = await accountsResponse.json();
    
    if (!accountsResponse.ok) {
      console.error('Plaid accounts error:', accountsData);
      throw new Error(`Failed to fetch accounts: ${accountsData.error_message}`);
    }

    // Sync accounts using enhanced schema
    let syncedAccounts = 0;
    for (const account of accountsData.accounts) {
      const { error: accountError } = await supabase
        .from('accounts')
        .upsert({
          user_id: user.id,
          account_id: account.account_id, // For compatibility
          plaid_account_id: account.account_id,
          name: account.name,
          official_name: account.official_name || account.name,
          type: account.type,
          subtype: account.subtype,
          mask: account.mask,
          balance: account.balances.current || account.balances.available || 0, // For compatibility
          available_balance: account.balances.available,
          current_balance: account.balances.current,
          credit_limit: account.balances.limit,
          currency_code: account.balances.iso_currency_code || 'USD',
          source: 'plaid',
        }, {
          onConflict: 'user_id,plaid_account_id',
        });

      if (accountError) {
        console.error('Error upserting account:', accountError);
      } else {
        syncedAccounts++;
      }
    }

    // Get transactions for last 3 months (more reasonable for sync)
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3);
    const endDate = new Date();

    const transactionsResponse = await fetch(`${plaidBaseUrl}/transactions/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: plaidClientId,
        secret: plaidSecret,
        access_token: decryptedToken,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        count: 500,
        offset: 0,
      }),
    });

    const transactionsData = await transactionsResponse.json();
    
    if (!transactionsResponse.ok) {
      console.error('Plaid transactions error:', transactionsData);
      throw new Error(`Failed to fetch transactions: ${transactionsData.error_message}`);
    }

    // Sync transactions using enhanced schema
    let syncedTransactions = 0;
    for (const transaction of transactionsData.transactions) {
      const { error: transactionError } = await supabase
        .from('transactions')
        .upsert({
          user_id: user.id,
          transaction_id: transaction.transaction_id, // For compatibility
          plaid_transaction_id: transaction.transaction_id,
          plaid_account_id: transaction.account_id,
          amount: Math.abs(transaction.amount), // Store positive amount
          date: transaction.date,
          datetime: transaction.datetime || null,
          authorized_date: transaction.authorized_date || null,
          authorized_datetime: transaction.authorized_datetime || null,
          description: transaction.name || transaction.merchant_name || 'Unknown Transaction',
          merchant_name: transaction.merchant_name,
          category: transaction.category?.[0] || 'Other',
          subcategory: transaction.category?.[1] || null,
          pending: transaction.pending || false,
          iso_currency_code: transaction.iso_currency_code || 'USD',
          unofficial_currency_code: transaction.unofficial_currency_code,
          location: transaction.location || null,
          payment_meta: transaction.payment_meta || null,
        }, {
          onConflict: 'user_id,plaid_transaction_id',
        });

      if (transactionError) {
        console.error('Error upserting transaction:', transactionError);
      } else {
        syncedTransactions++;
      }
    }

    console.log(`Successfully synced ${syncedAccounts} accounts and ${syncedTransactions} transactions for user:`, user.id);

    return new Response(JSON.stringify({ 
      success: true, 
      accounts: syncedAccounts,
      transactions: syncedTransactions 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in plaid-sync:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});