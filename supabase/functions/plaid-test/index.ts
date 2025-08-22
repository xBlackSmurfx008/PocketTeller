import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const plaidClientId = Deno.env.get('PLAID_CLIENT_ID');
    const plaidSecret = Deno.env.get('PLAID_SECRET');

    if (!plaidClientId || !plaidSecret) {
      throw new Error('Plaid credentials not found in environment variables');
    }

    console.log('Testing Plaid credentials...');
    console.log('Client ID:', plaidClientId);

    // Test Plaid API connection with a simple categories/get call
    const response = await fetch('https://sandbox.plaid.com/categories/get', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: plaidClientId,
        secret: plaidSecret,
      }),
    });

    const responseData = await response.json();
    console.log('Plaid API Response:', responseData);

    if (!response.ok) {
      throw new Error(`Plaid API error: ${response.status} - ${JSON.stringify(responseData)}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Plaid credentials are valid and API connection successful',
      clientId: plaidClientId,
      categoriesCount: responseData.categories?.length || 0,
      testTimestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Plaid test error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      testTimestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});