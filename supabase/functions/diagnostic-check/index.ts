/**
 * Diagnostic Check Function
 * Returns status of all required environment variables
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: {
        // Plaid Configuration
        hasPlaidClientId: !!Deno.env.get('PLAID_CLIENT_ID'),
        plaidClientIdLength: Deno.env.get('PLAID_CLIENT_ID')?.length || 0,
        hasPlaidSecret: !!Deno.env.get('PLAID_SECRET'),
        plaidSecretLength: Deno.env.get('PLAID_SECRET')?.length || 0,
        plaidEnv: Deno.env.get('PLAID_ENV') || 'NOT_SET',
        hasPlaidEncryptionKey: !!Deno.env.get('PLAID_ENCRYPTION_KEY'),
        plaidEncryptionKeyLength: Deno.env.get('PLAID_ENCRYPTION_KEY')?.length || 0,
        
        // Supabase Configuration
        hasSupabaseUrl: !!Deno.env.get('SUPABASE_URL'),
        supabaseUrl: Deno.env.get('SUPABASE_URL') || 'NOT_SET',
        hasSupabaseAnonKey: !!Deno.env.get('SUPABASE_ANON_KEY'),
        supabaseAnonKeyLength: Deno.env.get('SUPABASE_ANON_KEY')?.length || 0,
        hasSupabaseServiceKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
        supabaseServiceKeyLength: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.length || 0,
        
        // AI Configuration
        hasGeminiApiKey: !!Deno.env.get('GEMINI_API_KEY'),
        geminiApiKeyLength: Deno.env.get('GEMINI_API_KEY')?.length || 0,
      },
      issues: [] as string[],
      status: 'checking' as 'ok' | 'warning' | 'error' | 'checking',
    };

    // Check for critical issues
    if (!diagnostics.environment.hasPlaidClientId) {
      diagnostics.issues.push('CRITICAL: PLAID_CLIENT_ID is missing');
    }
    if (!diagnostics.environment.hasPlaidSecret) {
      diagnostics.issues.push('CRITICAL: PLAID_SECRET is missing');
    }
    if (!diagnostics.environment.plaidEnv || diagnostics.environment.plaidEnv === 'NOT_SET') {
      diagnostics.issues.push('CRITICAL: PLAID_ENV is missing');
    }
    if (!diagnostics.environment.hasPlaidEncryptionKey) {
      diagnostics.issues.push('CRITICAL: PLAID_ENCRYPTION_KEY is missing');
    }
    if (diagnostics.environment.plaidEncryptionKeyLength > 0 && diagnostics.environment.plaidEncryptionKeyLength !== 32) {
      diagnostics.issues.push(`WARNING: PLAID_ENCRYPTION_KEY should be 32 characters, got ${diagnostics.environment.plaidEncryptionKeyLength}`);
    }
    if (!diagnostics.environment.hasSupabaseUrl) {
      diagnostics.issues.push('CRITICAL: SUPABASE_URL is missing');
    }
    if (!diagnostics.environment.hasSupabaseServiceKey) {
      diagnostics.issues.push('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing');
    }
    if (!diagnostics.environment.hasGeminiApiKey) {
      diagnostics.issues.push('WARNING: GEMINI_API_KEY is missing (AI categorization will fail)');
    }

    // Determine overall status
    const criticalIssues = diagnostics.issues.filter(i => i.startsWith('CRITICAL'));
    const warningIssues = diagnostics.issues.filter(i => i.startsWith('WARNING'));
    
    if (criticalIssues.length > 0) {
      diagnostics.status = 'error';
    } else if (warningIssues.length > 0) {
      diagnostics.status = 'warning';
    } else {
      diagnostics.status = 'ok';
    }

    return new Response(JSON.stringify(diagnostics, null, 2), {
      status: 200,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Diagnostic check failed',
      message: error.message,
    }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});

