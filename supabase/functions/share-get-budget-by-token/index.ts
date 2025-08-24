import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Enhanced token validation - ensure it's the right format
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
      console.log('Invalid token format attempted:', token.substring(0, 8) + '...');
      return new Response(
        JSON.stringify({ error: 'Invalid token format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get client IP and User-Agent for logging
    const clientIP = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    console.log('Fetching budget share for token:', token);

    // Get the shared budget with enhanced security checks
    const { data: share, error } = await supabase
      .from('budget_shares')
      .select('*')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .lt('view_count', supabase.raw('COALESCE(max_views, 10)'))
      .single();

    if (error || !share) {
      console.error('Budget share not found, expired, or view limit exceeded:', error);
      return new Response(
        JSON.stringify({ 
          error: error?.code === 'PGRST116' 
            ? 'Budget share not found, expired, or view limit exceeded' 
            : 'Budget share not found or expired' 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if authentication is required and validate ownership
    if (share.requires_auth) {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Authentication required to view this budget' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Validate JWT and check ownership/email access
      try {
        const jwt = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
        
        if (authError || !user) {
          return new Response(
            JSON.stringify({ error: 'Invalid authentication token' }),
            { 
              status: 401, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        // Check if user owns the share or is in allowed emails
        const isOwner = user.id === share.user_id;
        const isAllowedEmail = share.allowed_emails && share.allowed_emails.includes(user.email);
        
        if (!isOwner && !isAllowedEmail) {
          return new Response(
            JSON.stringify({ error: 'Access denied to this budget share' }),
            { 
              status: 403, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }
      } catch (error) {
        console.error('JWT validation error:', error);
        return new Response(
          JSON.stringify({ error: 'Authentication validation failed' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Rate limiting check
    const isRateLimited = await supabase.rpc('check_budget_share_rate_limit', {
      share_id: share.id,
      ip_address: clientIP
    });

    if (!isRateLimited.data) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Log the access attempt
    await supabase.rpc('log_budget_share_access', {
      share_id: share.id,
      ip_address: clientIP,
      user_agent: userAgent
    });

    // Increment view count and update last accessed time
    await supabase
      .from('budget_shares')
      .update({ 
        view_count: share.view_count + 1,
        last_accessed_at: new Date().toISOString()
      })
      .eq('id', share.id);

    console.log('Budget share accessed successfully');

    return new Response(
      JSON.stringify({
        budget_data: share.budget_data,
        created_at: share.created_at,
        expires_at: share.expires_at,
        view_count: share.view_count + 1,
        remaining_views: (share.max_views || 10) - (share.view_count + 1)
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in share-get-budget-by-token:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});