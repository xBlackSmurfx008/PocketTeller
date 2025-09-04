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

    // Check rate limit
    const { data: rateLimitCheck, error: rateLimitError } = await supabase
      .rpc('check_link_token_rate', { target_user_id: user.id });

    if (rateLimitError) {
      console.error('Rate limit check failed:', rateLimitError);
      return new Response(JSON.stringify({ error: 'Rate limit check failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!rateLimitCheck) {
      // Log rate limit exceeded
      const { error: auditError } = await supabase
        .from('plaid_token_audit_log')
        .insert({
          user_id: user.id,
          access_type: 'link_token',
          function_name: 'plaid-link-token',
          ip_address: getClientIP(req),
          user_agent: req.headers.get('user-agent') || 'unknown',
          success: false,
          error_message: 'Rate limit exceeded: too many link token requests'
        });

      if (auditError) {
        console.error('Failed to log audit entry:', auditError);
      }

      return new Response(JSON.stringify({ 
        error: 'Too many link token requests. Please try again later.' 
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Creating link token for user:', user.id);

    // Create link token
    const linkTokenResponse = await fetch(`${plaidBaseUrl}/link/token/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: plaidClientId,
        secret: plaidSecret,
        user: {
          client_user_id: user.id
        },
        client_name: 'Pocket Banker',
        products: ['transactions'],
        country_codes: ['US'],
        language: 'en'
      }),
    });

    const linkTokenData = await linkTokenResponse.json();
    
    if (!linkTokenResponse.ok) {
      console.error('Plaid link token error:', linkTokenData);
      
      // Log failed link token creation
      const { error: auditError } = await supabase
        .from('plaid_token_audit_log')
        .insert({
          user_id: user.id,
          access_type: 'link_token',
          function_name: 'plaid-link-token',
          ip_address: getClientIP(req),
          user_agent: req.headers.get('user-agent') || 'unknown',
          success: false,
          error_message: linkTokenData.error_message || 'Unknown Plaid error'
        });

      if (auditError) {
        console.error('Failed to log audit entry:', auditError);
      }

      return new Response(JSON.stringify({ 
        error: "Failed to create link token"
      }), {
        status: linkTokenData.error_code === 'INVALID_REQUEST' ? 400 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log successful link token creation
    const { error: auditError } = await supabase
      .from('plaid_token_audit_log')
      .insert({
        user_id: user.id,
        access_type: 'link_token',
        function_name: 'plaid-link-token',
        ip_address: getClientIP(req),
        user_agent: req.headers.get('user-agent') || 'unknown',
        success: true
      });

    if (auditError) {
      console.error('Failed to log audit entry:', auditError);
    }

    console.log('Successfully created link token for user:', user.id);

    return new Response(JSON.stringify({ 
      link_token: linkTokenData.link_token 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in plaid-link-token:', error);
    return new Response(JSON.stringify({ error: "Failed to create link token" }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});