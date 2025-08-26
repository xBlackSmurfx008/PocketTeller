
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
  const sanitized = env.trim().replace(/^["']|["']$/g, '');
  
  console.log('Original PLAID_ENV:', env);
  console.log('Sanitized PLAID_ENV:', sanitized);
  
  if (sanitized.includes('://')) {
    let normalizedUrl = sanitized.startsWith('https://') 
      ? sanitized 
      : sanitized.replace(/^https?:\/\//, 'https://');
    
    normalizedUrl = normalizedUrl.replace(/\/$/, '');
    
    console.log('Normalized URL:', normalizedUrl);
    return normalizedUrl;
  }
  
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
  
  if (clientIP && (
    /^(\d{1,3}\.){3}\d{1,3}$/.test(clientIP) ||
    /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/.test(clientIP)
  )) {
    return clientIP;
  }
  
  return null;
};

// Map Plaid categories to our app categories
const mapPlaidCategory = (plaidCategories: string[]): string => {
  if (!plaidCategories || plaidCategories.length === 0) {
    return 'Other';
  }

  const primary = plaidCategories[0]?.toLowerCase() || '';
  
  // Category mapping from Plaid to our categories
  const categoryMap: { [key: string]: string } = {
    'food and drink': 'Food & Dining',
    'restaurants': 'Food & Dining',
    'fast food': 'Food & Dining',
    'coffee shops': 'Food & Dining',
    'groceries': 'Food & Dining',
    
    'transportation': 'Transportation',
    'gas stations': 'Transportation',
    'parking': 'Transportation',
    'public transportation': 'Transportation',
    'taxi': 'Transportation',
    'car service': 'Transportation',
    
    'shops': 'Shopping',
    'general merchandise': 'Shopping',
    'clothing and accessories': 'Shopping',
    'electronics': 'Shopping',
    'home improvement': 'Shopping',
    
    'recreation': 'Entertainment',
    'entertainment': 'Entertainment',
    'arts and entertainment': 'Entertainment',
    'gyms and fitness centers': 'Entertainment',
    
    'service': 'Bills & Utilities',
    'utilities': 'Bills & Utilities',
    'telecommunication services': 'Bills & Utilities',
    'internet and cable': 'Bills & Utilities',
    'phone': 'Bills & Utilities',
    
    'healthcare': 'Healthcare',
    'medical': 'Healthcare',
    'dentists': 'Healthcare',
    'hospitals': 'Healthcare',
    
    'travel': 'Travel',
    'airlines and aviation services': 'Travel',
    'lodging': 'Travel',
    'car rental': 'Travel',
    
    'payment': 'Income',
    'payroll': 'Income',
    'deposit': 'Income',
    'transfer': 'Income',
    
    'bank fees': 'Bills & Utilities',
    'overdraft': 'Bills & Utilities'
  };

  // Check for exact matches first
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

    // Get or create Plaid item entry to track sync cursor
    let { data: plaidItem, error: itemError } = await supabase
      .from('plaid_items')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (itemError && itemError.code !== 'PGRST116') {
      console.error('Error fetching Plaid item:', itemError);
    }

    // Get accounts from Plaid first to get item info
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

    // Update Plaid item metadata
    if (accountsData.item) {
      const { data: upsertedItem, error: itemUpsertError } = await supabase
        .from('plaid_items')
        .upsert({
          user_id: user.id,
          item_id: accountsData.item.item_id,
          institution_id: accountsData.item.institution_id,
          available_products: accountsData.item.available_products || [],
          billed_products: accountsData.item.billed_products || [],
          products: accountsData.item.products || [],
          update_type: 'sync',
          last_synced_at: new Date().toISOString()
        }, {
          onConflict: 'item_id'
        })
        .select()
        .single();

      if (!itemUpsertError) {
        plaidItem = upsertedItem;
      }
    }

    // Sync accounts using enhanced schema
    let syncedAccounts = 0;
    for (const account of accountsData.accounts) {
      const { error: accountError } = await supabase
        .from('accounts')
        .upsert({
          user_id: user.id,
          account_id: account.account_id,
          plaid_account_id: account.account_id,
          plaid_item_id_ref: accountsData.item?.item_id,
          name: account.name,
          official_name: account.official_name || account.name,
          type: account.type,
          subtype: account.subtype,
          mask: account.mask,
          balance: account.balances.current || account.balances.available || 0,
          available_balance: account.balances.available,
          current_balance: account.balances.current,
          credit_limit: account.balances.limit,
          currency_code: account.balances.iso_currency_code || 'USD',
          institution_id: accountsData.item?.institution_id,
          source: 'plaid',
        }, {
          onConflict: 'user_id,plaid_account_id',
        });

      if (accountError) {
        console.error('Error upserting account:', accountError);
        await supabase.from('plaid_token_audit_log').insert({
          user_id: user.id,
          access_type: 'sync_account_error',
          function_name: 'plaid-sync',
          success: false,
          error_message: `Account sync failed: ${accountError.message}`,
          ip_address: clientIP,
          user_agent: userAgent
        });
      } else {
        syncedAccounts++;
      }
    }

    // Use cursor-based transactions sync for better performance
    let syncedTransactions = 0;
    let hasMore = true;
    let cursor = plaidItem?.sync_cursor;

    while (hasMore) {
      const transactionsSyncResponse = await fetch(`${plaidBaseUrl}/transactions/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: plaidClientId,
          secret: plaidSecret,
          access_token: decryptedToken,
          cursor: cursor,
          count: 100
        }),
      });

      const syncData = await transactionsSyncResponse.json();
      
      if (!transactionsSyncResponse.ok) {
        console.error('Plaid transactions sync error:', syncData);
        throw new Error(`Failed to sync transactions: ${syncData.error_message}`);
      }

      // Process added transactions
      for (const transaction of syncData.added) {
        const mappedCategory = mapPlaidCategory(transaction.category);
        
        const { error: transactionError } = await supabase
          .from('transactions')
          .upsert({
            user_id: user.id,
            transaction_id: transaction.transaction_id,
            plaid_transaction_id: transaction.transaction_id,
            plaid_account_id: transaction.account_id,
            amount: Math.abs(transaction.amount),
            date: transaction.date,
            datetime: transaction.datetime || null,
            authorized_date: transaction.authorized_date || null,
            authorized_datetime: transaction.authorized_datetime || null,
            description: transaction.name || transaction.merchant_name || 'Unknown Transaction',
            merchant_name: transaction.merchant_name,
            category: mappedCategory,
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

      // Process modified transactions
      for (const transaction of syncData.modified) {
        const mappedCategory = mapPlaidCategory(transaction.category);
        
        const { error: transactionError } = await supabase
          .from('transactions')
          .upsert({
            user_id: user.id,
            transaction_id: transaction.transaction_id,
            plaid_transaction_id: transaction.transaction_id,
            plaid_account_id: transaction.account_id,
            amount: Math.abs(transaction.amount),
            date: transaction.date,
            datetime: transaction.datetime || null,
            authorized_date: transaction.authorized_date || null,
            authorized_datetime: transaction.authorized_datetime || null,
            description: transaction.name || transaction.merchant_name || 'Unknown Transaction',
            merchant_name: transaction.merchant_name,
            category: mappedCategory,
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
          console.error('Error updating transaction:', transactionError);
        }
      }

      // Process removed transactions
      if (syncData.removed && syncData.removed.length > 0) {
        const { error: deleteError } = await supabase
          .from('transactions')
          .delete()
          .eq('user_id', user.id)
          .in('plaid_transaction_id', syncData.removed.map((t: any) => t.transaction_id));

        if (deleteError) {
          console.error('Error deleting transactions:', deleteError);
        }
      }

      // Update cursor and check if more data exists
      cursor = syncData.next_cursor;
      hasMore = syncData.has_more;

      // Update the plaid item with new cursor
      if (plaidItem) {
        await supabase
          .from('plaid_items')
          .update({
            sync_cursor: cursor,
            last_synced_at: new Date().toISOString()
          })
          .eq('id', plaidItem.id);
      }
    }

    console.log(`Successfully synced ${syncedAccounts} accounts and ${syncedTransactions} transactions for user:`, user.id);

    return new Response(JSON.stringify({ 
      success: true, 
      accounts: syncedAccounts,
      transactions: syncedTransactions,
      cursor_updated: !!cursor
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
