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

    // Count user's connected bank accounts
    const { data: items, error: countError } = await supabaseClient
      .from('plaid_items')
      .select('id, institution_name, institution_id, created_at')
      .eq('user_id', user.id);

    if (countError) {
      console.error('Error counting plaid items:', countError);
      return new Response(
        JSON.stringify({ error: 'Failed to check connection limit' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const connectedCount = items?.length || 0;
    const maxConnections = 3;
    const canConnect = connectedCount < maxConnections;
    const remainingSlots = Math.max(0, maxConnections - connectedCount);

    return new Response(
      JSON.stringify({
        connectedCount,
        maxConnections,
        canConnect,
        remainingSlots,
        connectedBanks: items?.map(item => ({
          id: item.id,
          institutionName: item.institution_name,
          institutionId: item.institution_id,
          connectedAt: item.created_at,
        })) || [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('plaid-check-limit error:', error);
    return new Response(
      JSON.stringify({ error: 'Service temporarily unavailable' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

