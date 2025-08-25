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

    // Encrypt and store the access token securely
    const encryptionKey = Deno.env.get('PLAID_ENCRYPTION_KEY');
    if (!encryptionKey) {
      return new Response(JSON.stringify({ error: 'Encryption key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: encryptionResult, error: encryptError } = await supabase
      .rpc('encrypt_plaid_token', { 
        token: exchangeData.access_token,
        encryption_key: encryptionKey
      });

    if (encryptError || !encryptionResult) {
      console.error('Token encryption failed:', encryptError);
      return new Response(JSON.stringify({ error: 'Failed to encrypt token' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

    // Safely parse client IP from x-forwarded-for (may contain multiple IPs)
    const forwardedFor = req.headers.get('x-forwarded-for');
    const clientIP = forwardedFor ? forwardedFor.split(',')[0].trim() : 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Log the encryption in audit trail
    const { error: auditError } = await supabase
      .from('plaid_token_audit_log')
      .insert({
        user_id: user.id,
        access_type: 'encrypt',
        function_name: 'plaid-link-exchange',
        ip_address: clientIP,
        user_agent: userAgent,
        success: true
      });

    if (auditError) {
      console.error('Failed to log audit entry:', auditError);
    }

    console.log('Token successfully saved and verified for user:', user.id);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Bank account connected successfully',
      hasPlaidConnection: true,
      saved: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in plaid-link-exchange:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});