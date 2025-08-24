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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    // Decrypt the access token
    const encryptionKey = Deno.env.get('PLAID_ENCRYPTION_KEY');
    if (!encryptionKey) {
      throw new Error('Encryption key not configured');
    }

    const { data: decryptedToken, error: decryptError } = await supabase
      .rpc('decrypt_plaid_token', {
        encrypted_data: {
          encrypted_token: profile.encrypted_plaid_token,
          iv: profile.token_iv
        },
        encryption_key: encryptionKey
      });

    if (decryptError || !decryptedToken) {
      console.error('Token decryption failed:', decryptError);
      throw new Error('Failed to decrypt token');
    }

    // Get accounts from Plaid
    const accountsResponse = await fetch('https://production.plaid.com/accounts/get', {
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

    // Sync accounts
    for (const account of accountsData.accounts) {
      const { error: accountError } = await supabase
        .from('accounts')
        .upsert({
          user_id: user.id,
          account_id: account.account_id,
          name: account.name,
          type: account.type,
          balance: account.balances.current || 0,
          source: 'plaid',
        }, {
          onConflict: 'user_id,account_id',
        });

      if (accountError) {
        console.error('Error upserting account:', accountError);
      }
    }

    // Get transactions for last 24 months
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 24);
    const endDate = new Date();

    const transactionsResponse = await fetch('https://production.plaid.com/transactions/get', {
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

    // Get account mapping for user's accounts
    const { data: userAccounts } = await supabase
      .from('accounts')
      .select('id, account_id')
      .eq('user_id', user.id);

    const accountMap = new Map(
      userAccounts?.map(acc => [acc.account_id, acc.id]) || []
    );

    // Sync transactions
    let syncedCount = 0;
    for (const transaction of transactionsData.transactions) {
      const accountId = accountMap.get(transaction.account_id);
      
      if (!accountId) {
        console.warn('Account not found for transaction:', transaction.account_id);
        continue;
      }

      const { error: transactionError } = await supabase
        .from('transactions')
        .upsert({
          user_id: user.id,
          transaction_id: transaction.transaction_id,
          account_id: accountId,
          amount: Math.abs(transaction.amount),
          description: transaction.name,
          category: transaction.category?.[0] || 'Other',
          date: transaction.date,
        }, {
          onConflict: 'user_id,transaction_id',
        });

      if (transactionError) {
        console.error('Error upserting transaction:', transactionError);
      } else {
        syncedCount++;
      }
    }

    console.log(`Successfully synced ${accountsData.accounts.length} accounts and ${syncedCount} transactions for user:`, user.id);

    return new Response(JSON.stringify({ 
      success: true, 
      accounts: accountsData.accounts.length,
      transactions: syncedCount 
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