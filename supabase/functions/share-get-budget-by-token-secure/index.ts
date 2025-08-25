import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface ShareRequest {
  token: string;
  userAgent?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST requests for security
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST.' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { token, userAgent }: ShareRequest = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get client IP address
    const clientIP = req.headers.get('cf-connecting-ip') || 
                    req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown';

    console.log(`Share access attempt - Token: ${token.substring(0, 8)}..., IP: ${clientIP}`);

    // Use the secure validation function
    const { data: validationResult, error: validationError } = await supabase.rpc('validate_share_access', {
      share_token: token,
      request_ip: clientIP
    });

    if (validationError) {
      console.error('Validation error:', validationError);
      return new Response(
        JSON.stringify({ error: 'Failed to validate share access' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!validationResult?.success) {
      console.log('Share access denied:', validationResult?.error);
      return new Response(
        JSON.stringify({ error: validationResult?.error || 'Access denied' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Log the access
    const { error: logError } = await supabase.rpc('log_budget_share_access', {
      share_id: validationResult.share_id,
      ip_address: clientIP,
      user_agent: userAgent || req.headers.get('user-agent') || 'unknown'
    });

    if (logError) {
      console.error('Failed to log access:', logError);
    }

    // Increment view count
    const { error: updateError } = await supabase
      .from('budget_shares')
      .update({ 
        view_count: supabase.raw('view_count + 1'),
        last_accessed_at: new Date().toISOString()
      })
      .eq('id', validationResult.share_id);

    if (updateError) {
      console.error('Failed to update view count:', updateError);
    }

    console.log(`Share access granted for token: ${token.substring(0, 8)}...`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        budgetData: validationResult.budget_data 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in share-get-budget-by-token-secure:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});