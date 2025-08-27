import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://dscndbpqvhvylukvcgpq.lovableproject.com',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Credentials': 'true',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const plaidClientId = Deno.env.get('PLAID_CLIENT_ID')!;
const plaidSecret = Deno.env.get('PLAID_SECRET')!;
const plaidEncryptionKey = Deno.env.get('PLAID_ENCRYPTION_KEY')!;
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
    if (!plaidClientId || !plaidSecret || !plaidEncryptionKey) {
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

    // Get user's encrypted token
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('encrypted_plaid_token, token_iv')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile || !profile.encrypted_plaid_token) {
      return new Response(JSON.stringify({ error: 'No Plaid connection found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Decrypt the access token
    const { data: decryptedToken, error: decryptError } = await supabase
      .rpc('decrypt_plaid_token_with_audit', {
        encrypted_data: {
          encrypted_token: profile.encrypted_plaid_token,
          iv: profile.token_iv
        },
        encryption_key: plaidEncryptionKey,
        function_name: 'plaid-disconnect',
        ip_address: getClientIP(req),
        user_agent: req.headers.get('user-agent') || 'unknown',
        target_user_id: user.id
      });

    if (decryptError || !decryptedToken) {
      console.error('Token decryption failed:', decryptError);
      return new Response(JSON.stringify({ error: 'Failed to decrypt access token' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call Plaid /item/remove endpoint
    const removeResponse = await fetch(`${plaidBaseUrl}/item/remove`, {
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

    const removeData = await removeResponse.json();
    
    if (!removeResponse.ok) {
      console.error('Plaid item/remove error:', removeData);
      
      // Log failed revocation
      const { error: auditError } = await supabase
        .from('plaid_token_audit_log')
        .insert({
          user_id: user.id,
          access_type: 'revoke',
          function_name: 'plaid-disconnect',
          ip_address: getClientIP(req),
          user_agent: req.headers.get('user-agent') || 'unknown',
          success: false,
          error_message: removeData.error_message || 'Unknown Plaid error'
        });

      if (auditError) {
        console.error('Failed to log audit entry:', auditError);
      }

      return new Response(JSON.stringify({ 
        error: `Plaid disconnect failed: ${removeData.error_message}`,
        plaid_error_code: removeData.error_code 
      }), {
        status: removeData.error_code === 'INVALID_ACCESS_TOKEN' ? 404 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Clear encrypted token and token_iv from profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        encrypted_plaid_token: null,
        token_iv: null,
        last_token_rotation: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error clearing profile token:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to clear stored token' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log successful revocation
    const { error: auditError } = await supabase
      .from('plaid_token_audit_log')
      .insert({
        user_id: user.id,
        access_type: 'revoke',
        function_name: 'plaid-disconnect',
        ip_address: getClientIP(req),
        user_agent: req.headers.get('user-agent') || 'unknown',
        success: true
      });

    if (auditError) {
      console.error('Failed to log audit entry:', auditError);
    }

    console.log('Successfully disconnected Plaid for user:', user.id);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in plaid-disconnect:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});