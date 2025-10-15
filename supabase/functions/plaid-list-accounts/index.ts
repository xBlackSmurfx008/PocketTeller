import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract JWT token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user authentication
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all connected bank accounts with their details
    const { data: items, error: itemsError } = await supabaseClient
      .from('plaid_items')
      .select('id, item_id, institution_name, institution_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (itemsError) {
      console.error('Error fetching plaid items:', itemsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch connected accounts' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For each item, fetch associated accounts and balances
    const itemsWithAccounts = await Promise.all(
      (items || []).map(async (item) => {
        const { data: accounts, error: accountsError } = await supabaseClient
          .from('accounts')
          .select('id, plaid_account_id, name, official_name, type, subtype, mask, available_balance, current_balance, currency_code')
          .eq('user_id', user.id)
          .eq('plaid_item_id_ref', item.item_id);

        if (accountsError) {
          console.error(`Error fetching accounts for item ${item.item_id}:`, accountsError);
          return {
            ...item,
            accounts: [],
            totalBalance: 0,
          };
        }

        const totalBalance = (accounts || []).reduce((sum, acc) => {
          const balance = Number(acc.available_balance) || Number(acc.current_balance) || 0;
          return sum + balance;
        }, 0);

        return {
          itemId: item.item_id,
          institutionName: item.institution_name,
          institutionId: item.institution_id,
          connectedAt: item.created_at,
          accounts: (accounts || []).map(acc => ({
            id: acc.id,
            plaidAccountId: acc.plaid_account_id,
            name: acc.name,
            officialName: acc.official_name,
            type: acc.type,
            subtype: acc.subtype,
            mask: acc.mask,
            balanceAvailable: acc.available_balance,
            balanceCurrent: acc.current_balance,
            currencyCode: acc.currency_code,
          })),
          totalBalance,
        };
      })
    );

    return new Response(
      JSON.stringify({
        connectedBanks: itemsWithAccounts,
        totalConnected: items?.length || 0,
        maxConnections: 3,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('plaid-list-accounts error:', error);
    return new Response(
      JSON.stringify({ error: 'Service temporarily unavailable' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

