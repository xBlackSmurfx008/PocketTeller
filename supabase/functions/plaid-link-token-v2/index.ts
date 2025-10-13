/**
 * Plaid Link Token Generation (Refactored)
 * Generates secure link tokens for Plaid Link initialization
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  CORS_HEADERS,
  getPlaidBaseUrl,
  getClientIP,
  validatePlaidConfig,
  errorResponse,
  successResponse,
  logger,
  PlaidAPIClient,
} from '../_shared/plaid-utils.ts';
import {
  createServiceClient,
  getAuthenticatedUser,
  checkRateLimit,
  logAudit,
} from '../_shared/database-utils.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    // 1. Load and validate configuration
    const config = {
      clientId: Deno.env.get('PLAID_CLIENT_ID'),
      secret: Deno.env.get('PLAID_SECRET'),
      env: Deno.env.get('PLAID_ENV') || 'sandbox',
    };

    validatePlaidConfig(config);

    const plaidBaseUrl = getPlaidBaseUrl(config.env!);
    if (!plaidBaseUrl) {
      return errorResponse(
        `Invalid Plaid environment: "${config.env}". Use "sandbox", "development", or "production".`,
        500
      );
    }

    // 2. Authenticate user
    const supabase = createServiceClient();
    const authHeader = req.headers.get('Authorization');
    const user = await getAuthenticatedUser(supabase, authHeader);

    logger.info('Link token request', { userId: user.id });

    // 3. Check rate limiting
    const canProceed = await checkRateLimit(
      supabase,
      user.id,
      'check_link_token_rate'
    );

    if (!canProceed) {
      // Log rate limit violation
      await logAudit(supabase, {
        user_id: user.id,
        access_type: 'link_token',
        function_name: 'plaid-link-token',
        ip_address: getClientIP(req),
        user_agent: req.headers.get('user-agent') || 'unknown',
        success: false,
        error_message: 'Rate limit exceeded',
      });

      return errorResponse(
        'Too many link token requests. Please try again in a few minutes.',
        429
      );
    }

    // 4. Create link token via Plaid API
    const plaidClient = new PlaidAPIClient(
      plaidBaseUrl,
      config.clientId!,
      config.secret!
    );

    const linkToken = await plaidClient.createLinkToken(user.id);

    // 5. Log successful creation
    await logAudit(supabase, {
      user_id: user.id,
      access_type: 'link_token',
      function_name: 'plaid-link-token',
      ip_address: getClientIP(req),
      user_agent: req.headers.get('user-agent') || 'unknown',
      success: true,
    });

    logger.success('Link token created', { userId: user.id });

    return successResponse({ link_token: linkToken });

  } catch (error) {
    logger.error('Link token creation failed', error);
    
    return errorResponse(
      error instanceof Error ? error.message : 'Failed to create link token',
      500
    );
  }
});

