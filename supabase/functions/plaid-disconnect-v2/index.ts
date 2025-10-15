/**
 * Plaid Disconnect (Refactored)
 * Revokes Plaid access and cleans up stored data
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
  getUserPlaidToken,
  decryptPlaidToken,
  clearPlaidToken,
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
      encryptionKey: Deno.env.get('PLAID_ENCRYPTION_KEY'),
    };

    validatePlaidConfig(config);

    const plaidBaseUrl = getPlaidBaseUrl(config.env!);
    if (!plaidBaseUrl) {
      return errorResponse(`Invalid Plaid environment: "${config.env}"`, 500);
    }

    // 2. Authenticate user
    const supabase = createServiceClient();
    const authHeader = req.headers.get('Authorization');
    const user = await getAuthenticatedUser(supabase, authHeader);

    logger.info('Disconnect request', { userId: user.id });

    // 3. Get encrypted access token
    const encryptedToken = await getUserPlaidToken(supabase, user.id);
    if (!encryptedToken) {
      return errorResponse('No Plaid connection found', 404);
    }

    // 4. Decrypt access token
    const decryptedToken = await decryptPlaidToken(
      supabase,
      encryptedToken,
      config.encryptionKey!,
      {
        functionName: 'plaid-disconnect',
        ipAddress: getClientIP(req),
        userAgent: req.headers.get('user-agent') || 'unknown',
        userId: user.id,
      }
    );

    // 5. Revoke access token with Plaid
    try {
      logger.info('Revoking Plaid access');
      const plaidClient = new PlaidAPIClient(
        plaidBaseUrl,
        config.clientId!,
        config.secret!
      );

      await plaidClient.removeItem(decryptedToken);
      logger.success('Plaid access revoked');

    } catch (plaidError) {
      logger.warn('Plaid revocation failed, continuing with cleanup', plaidError);
      // Continue even if Plaid revocation fails - we still want to clean up locally
    }

    // 6. Clear stored token
    await clearPlaidToken(supabase, user.id);
    logger.success('Local token cleared');

    // 7. Log successful disconnection
    await logAudit(supabase, {
      user_id: user.id,
      access_type: 'revoke',
      function_name: 'plaid-disconnect',
      ip_address: getClientIP(req),
      user_agent: req.headers.get('user-agent') || 'unknown',
      success: true,
    });

    logger.success('Bank disconnected', { userId: user.id });

    return successResponse({ 
      success: true,
      message: 'Bank account disconnected successfully',
    });

  } catch (error) {
    logger.error('Disconnect failed', error);

    // Log failed disconnection
    try {
      const supabase = createServiceClient();
      const authHeader = req.headers.get('Authorization');
      const user = await getAuthenticatedUser(supabase, authHeader);

      await logAudit(supabase, {
        user_id: user.id,
        access_type: 'revoke',
        function_name: 'plaid-disconnect',
        ip_address: getClientIP(req),
        user_agent: req.headers.get('user-agent') || 'unknown',
        success: false,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
    } catch {
      // Ignore audit logging errors
    }
    
    return errorResponse(
      error instanceof Error 
        ? error.message 
        : 'Failed to disconnect bank account',
      500
    );
  }
});

