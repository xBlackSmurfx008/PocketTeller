import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Keep public for share access
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

    // Log access attempt with token masking
    console.log(`Share access attempt - Token: ${token.substring(0, 8)}***, IP: ${clientIP}`);

    // Extract user email from JWT if provided
    let userEmail = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const jwt = authHeader.replace('Bearer ', '');
      const anonSupabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      );
      
      try {
        const { data: { user }, error: authError } = await anonSupabase.auth.getUser(jwt);
        if (!authError && user) {
          userEmail = user.email;
          console.log(`Authenticated user: ${userEmail?.replace(/(.{2}).+@/, '$1***@')}`);
        }
      } catch (authParseError) {
        console.log('JWT parsing failed, proceeding as anonymous');
      }
    }

    // Use the NEW secure function instead of the old validation function
    const { data: secureResult, error: secureError } = await supabase.rpc('get_shared_budget_secure', {
      share_token: token,
      user_email: userEmail
    });

    if (secureError) {
      console.error('Secure access error:', secureError);
      return new Response(
        JSON.stringify({ error: 'Failed to access shared budget' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (secureResult?.error) {
      console.log(`Share access denied: ${secureResult.error}, User: ${userEmail?.replace(/(.{2}).+@/, '$1***@') || 'anonymous'}`);
      
      // Return appropriate status code based on error type
      let statusCode = 403;
      if (secureResult.error === 'Authentication required') {
        statusCode = 401;
      }
      
      return new Response(
        JSON.stringify({ error: secureResult.error }),
        { 
          status: statusCode, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get the share_id for logging by validating the token
    const { data: shareValidation } = await supabase.from('budget_shares')
      .select('id')
      .eq('token', token)
      .single();

    if (shareValidation?.id) {
      // Log the access
      const { error: logError } = await supabase.rpc('log_budget_share_access', {
        share_id: shareValidation.id,
        ip_address: clientIP,
        user_agent: userAgent || req.headers.get('user-agent') || 'unknown'
      });

      if (logError) {
        console.error('Failed to log access:', logError);
      }

      // Safely increment view count using secure RPC
      const { error: incrementError } = await supabase.rpc('increment_budget_share_view', {
        share_id: shareValidation.id
      });

      if (incrementError) {
        console.error('Failed to increment view count:', incrementError);
        // Continue processing - don't fail the request for this
      }
    }

    console.log(`Share access granted for token: ${token.substring(0, 8)}***, User: ${userEmail?.replace(/(.{2}).+@/, '$1***@') || 'anonymous'}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        budgetData: secureResult // Now using the filtered, secure result
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