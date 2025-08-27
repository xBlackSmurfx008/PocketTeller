
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

// Map Plaid categories to our app categories
const mapPlaidCategory = (plaidCategories: string[]): string => {
  if (!plaidCategories || plaidCategories.length === 0) {
    return 'Other';
  }

  const category = plaidCategories[0].toLowerCase();
  
  if (category.includes('food') || category.includes('restaurant')) return 'Food & Dining';
  if (category.includes('travel') || category.includes('transportation')) return 'Transportation';
  if (category.includes('shop') || category.includes('retail')) return 'Shopping';
  if (category.includes('entertainment') || category.includes('recreation')) return 'Entertainment';
  if (category.includes('healthcare') || category.includes('medical')) return 'Healthcare';
  if (category.includes('utilities') || category.includes('bills')) return 'Bills & Utilities';
  if (category.includes('transfer') || category.includes('deposit')) return 'Transfer';
  if (category.includes('interest') || category.includes('dividend')) return 'Income';
  
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
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid auth token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { public_token } = await req.json();
    
    if (!public_token) {
      return new Response(JSON.stringify({ error: 'No public_token provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Starting Plaid token exchange for user:', user.id);

    // Get client info early for audit logging
    const clientIP = getClientIP(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Exchange public token for access token
    const exchangeResponse = await fetch(`${plaidBaseUrl}/item/public_token/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: plaidClientId,
        secret: plaidSecret,
        public_token: public_token,
      }),
    });

    const exchangeData = await exchangeResponse.json();
    
    if (!exchangeResponse.ok) {
      console.error('Plaid exchange error:', exchangeData);
      return new Response(JSON.stringify({ 
        error: `Plaid exchange failed: ${exchangeData.error_message}`,
        plaid_error_code: exchangeData.error_code 
      }), {
        status: exchangeData.error_code === 'INVALID_PUBLIC_TOKEN' ? 400 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Plaid token exchange successful, proceeding with encryption');

    // Encrypt and store the access token securely
    const encryptionKey = Deno.env.get('PLAID_ENCRYPTION_KEY');
    if (!encryptionKey) {
      console.error('PLAID_ENCRYPTION_KEY not found in environment');
      return new Response(JSON.stringify({ error: 'Encryption key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Calling encrypt_plaid_token function');
    const { data: encryptionResult, error: encryptError } = await supabase
      .rpc('encrypt_plaid_token', { 
        token: exchangeData.access_token,
        encryption_key: encryptionKey
      });

    if (encryptError) {
      console.error('Token encryption failed:', encryptError);
      return new Response(JSON.stringify({ 
        error: 'Failed to encrypt token',
        details: encryptError.message 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!encryptionResult) {
      console.error('Encryption result is null or empty');
      return new Response(JSON.stringify({ error: 'Encryption returned no result' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Token encryption successful, saving to profile');

    // Try to update existing profile first
    const { data: updateResult, error: updateError } = await supabase
      .from('profiles')
      .update({ 
        encrypted_plaid_token: encryptionResult.encrypted_token,
        token_iv: encryptionResult.iv,
        last_token_rotation: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select('user_id');

    // If no rows were updated (profile doesn't exist), create one
    if (!updateError && (!updateResult || updateResult.length === 0)) {
      console.log('No existing profile found, creating new one for user:', user.id);
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          app_id: 'budget-ai',
          encrypted_plaid_token: encryptionResult.encrypted_token,
          token_iv: encryptionResult.iv,
          last_token_rotation: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error creating profile:', insertError);
        return new Response(JSON.stringify({ error: 'Failed to create user profile' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else if (updateError) {
      console.error('Error updating profile:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to store access token' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the token was saved successfully
    const { data: verifyProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('encrypted_plaid_token')
      .eq('user_id', user.id)
      .single();

    if (verifyError || !verifyProfile?.encrypted_plaid_token) {
      console.error('Failed to verify token save:', verifyError);
      return new Response(JSON.stringify({ error: 'Token save verification failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Token save verified, now fetching account data from Plaid');

    // Fetch account data from Plaid using the access_token
    const accountsResponse = await fetch(`${plaidBaseUrl}/accounts/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: plaidClientId,
        secret: plaidSecret,
        access_token: exchangeData.access_token,
      }),
    });

    let accountsCount = 0;
    let transactionsCount = 0;

    if (!accountsResponse.ok) {
      const accountsError = await accountsResponse.text();
      console.error('Plaid accounts fetch failed:', accountsError);
      // Don't fail the whole flow - token is saved, accounts can be synced later
    } else {
      const accountsData = await accountsResponse.json();
      console.log('Accounts data retrieved:', accountsData.accounts?.length || 0, 'accounts');

    // Store Plaid item metadata first
    const { error: itemError } = await supabase
      .from('plaid_items')
      .upsert({
        user_id: user.id,
        item_id: exchangeData.item_id,
        institution_id: accountsData.item?.institution_id,
        available_products: accountsData.item?.available_products || [],
        billed_products: accountsData.item?.billed_products || [],
        products: accountsData.item?.products || []
      }, {
        onConflict: 'item_id'
      });

    if (itemError) {
      console.warn('Failed to store Plaid item metadata:', itemError);
      // Don't fail the entire process for this
    }

    // Save accounts to database
    if (accountsData.accounts && accountsData.accounts.length > 0) {
      const accountsToInsert = accountsData.accounts.map((account: any) => ({
        user_id: user.id,
        plaid_account_id: account.account_id,
        plaid_item_id: exchangeData.item_id,
        plaid_item_id_ref: exchangeData.item_id,
        account_id: account.account_id, // For compatibility with existing schema
        name: account.name,
        official_name: account.official_name || account.name,
        type: account.type,
        subtype: account.subtype,
        mask: account.mask,
        available_balance: account.balances.available,
        current_balance: account.balances.current,
        balance: account.balances.current || account.balances.available || 0, // For compatibility
        credit_limit: account.balances.limit,
        currency_code: account.balances.iso_currency_code || 'USD',
        institution_id: accountsData.item?.institution_id,
        institution_name: 'Connected Bank', // Will be updated with actual name later
        source: 'plaid'
      }));

      const { data: accountInsertResult, error: accountInsertError } = await supabase
        .from('accounts')
        .upsert(accountsToInsert, { 
          onConflict: 'user_id,plaid_account_id',
          ignoreDuplicates: false 
        })
        .select();

      if (accountInsertError) {
        console.error('Account insert error:', accountInsertError);
        await supabase.from('plaid_token_audit_log').insert({
          user_id: user.id,
          access_type: 'accounts_store',
          function_name: 'plaid-link-exchange',
          success: false,
          error_message: `Accounts storage failed: ${accountInsertError.message}`,
          ip_address: clientIP,
          user_agent: userAgent
        });
      } else {
        accountsCount = accountInsertResult?.length || 0;
        console.log('Successfully saved', accountsCount, 'accounts');
      }
    }

      // Fetch recent transactions (last 30 days)
      console.log('Fetching recent transaction data from Plaid');
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const transactionsResponse = await fetch(`${plaidBaseUrl}/transactions/get`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: plaidClientId,
          secret: plaidSecret,
          access_token: exchangeData.access_token,
          start_date: thirtyDaysAgo.toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0],
          options: {
            count: 100
          }
        }),
      });

      if (!transactionsResponse.ok) {
        const transactionsError = await transactionsResponse.text();
        console.error('Plaid transactions fetch failed:', transactionsError);
      } else {
        const transactionsData = await transactionsResponse.json();
        console.log('Transactions data retrieved:', transactionsData.transactions?.length || 0, 'transactions');

        // Save transactions to database  
        if (transactionsData.transactions && transactionsData.transactions.length > 0) {
          try {
            const transactionsToInsert = transactionsData.transactions.map((transaction: any) => ({
              user_id: user.id,
              plaid_transaction_id: transaction.transaction_id,
              plaid_account_id: transaction.account_id,
              transaction_id: transaction.transaction_id, // For compatibility
              amount: Math.abs(transaction.amount), // Plaid uses negative for debits, we store positive
              date: transaction.date,
              datetime: transaction.datetime || null,
              authorized_date: transaction.authorized_date || null,
              authorized_datetime: transaction.authorized_datetime || null,
              description: transaction.name || transaction.merchant_name || 'Unknown Transaction',
              merchant_name: transaction.merchant_name,
              category: mapPlaidCategory(transaction.category || []),
              category_source: 'auto',
              subcategory: transaction.category?.[1] || null,
              pending: transaction.pending || false,
              iso_currency_code: transaction.iso_currency_code || 'USD',
              unofficial_currency_code: transaction.unofficial_currency_code,
              location: transaction.location ? transaction.location : null,
              payment_meta: transaction.payment_meta ? transaction.payment_meta : null
            }));

            const { data: transactionInsertResult, error: transactionInsertError } = await supabase
              .from('transactions')
              .upsert(transactionsToInsert, { 
                onConflict: 'user_id,plaid_transaction_id',
                ignoreDuplicates: false 
              })
              .select();

            if (transactionInsertError) {
              console.error('Transaction insert error:', transactionInsertError);
              // Log transaction error but don't fail the whole process
              await supabase.from('plaid_token_audit_log').insert({
                user_id: user.id,
                access_type: 'transactions_store',
                function_name: 'plaid-link-exchange',
                success: false,
                error_message: `Transactions storage failed: ${transactionInsertError.message}`,
                ip_address: clientIP,
                user_agent: userAgent
              });
            } else {
              transactionsCount = transactionInsertResult?.length || 0;
              console.log('Successfully saved', transactionsCount, 'transactions');
            }
          } catch (error) {
            console.error('Error processing transactions:', error);
            // Don't fail the whole process if transactions fail
          }
        }
      }
    }

    // Client IP and user agent already defined at the top of the function

    // Log the encryption in audit trail
    const { error: auditError } = await supabase
      .from('plaid_token_audit_log')
      .insert({
        user_id: user.id,
        access_type: 'encrypt',
        function_name: 'plaid-link-exchange',
        ip_address: clientIP, // Will be null if invalid IP, which is fine for inet type
        user_agent: userAgent,
        success: true
      });

    if (auditError) {
      console.error('Failed to log audit entry:', auditError);
    }

    console.log('Token and data successfully saved for user:', user.id);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Bank account connected successfully',
      hasPlaidConnection: true,
      saved: true,
      accounts: accountsCount,
      transactions: transactionsCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in plaid-link-exchange:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
