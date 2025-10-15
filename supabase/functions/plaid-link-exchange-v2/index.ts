/**
 * Plaid Link Exchange (Refactored)
 * Exchanges public tokens for access tokens and syncs initial data
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
  mapPlaidCategory,
} from '../_shared/plaid-utils.ts';
import type { PlaidLinkExchangeRequest, DatabaseAccount, DatabaseTransaction } from '../_shared/plaid-types.ts';
import {
  createServiceClient,
  getAuthenticatedUser,
  logAudit,
  encryptPlaidToken,
  storePlaidToken,
  upsertPlaidItem,
  upsertAccounts,
  upsertTransactions,
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
      return errorResponse(
        `Invalid Plaid environment: "${config.env}"`,
        500
      );
    }

    // 2. Authenticate user
    const supabase = createServiceClient();
    const authHeader = req.headers.get('Authorization');
    const user = await getAuthenticatedUser(supabase, authHeader);

    logger.info('Token exchange request', { userId: user.id });

    // 3. Parse request body
    const body: PlaidLinkExchangeRequest = await req.json();
    
    if (!body.public_token) {
      return errorResponse('No public_token provided', 400);
    }

    // 4. Exchange public token for access token
    const plaidClient = new PlaidAPIClient(
      plaidBaseUrl,
      config.clientId!,
      config.secret!
    );

    logger.info('Exchanging public token');
    const exchangeData = await plaidClient.exchangePublicToken(body.public_token);

    // 5. Encrypt and store access token
    logger.info('Encrypting access token');
    const encryptedData = await encryptPlaidToken(
      supabase,
      exchangeData.access_token,
      config.encryptionKey!
    );

    await storePlaidToken(supabase, user.id, encryptedData);
    logger.success('Access token stored securely');

    // 6. Fetch accounts from Plaid
    logger.info('Fetching account data');
    const accountsData = await plaidClient.getAccounts(exchangeData.access_token);

    let accountsCount = 0;
    let transactionsCount = 0;

    // 7. Store Plaid item metadata
    await upsertPlaidItem(supabase, {
      user_id: user.id,
      item_id: exchangeData.item_id,
      institution_id: body.institution_id || accountsData.item?.institution_id,
      institution_name: body.institution_name || 
        accountsData.accounts?.[0]?.name?.split(' - ')?.[0] || 
        'Connected Bank',
      available_products: accountsData.item?.available_products || [],
      billed_products: accountsData.item?.billed_products || [],
      products: accountsData.item?.products || [],
    });

    logger.success('Plaid item metadata stored');

    // 8. Store accounts
    if (accountsData.accounts && accountsData.accounts.length > 0) {
      const dbAccounts: DatabaseAccount[] = accountsData.accounts.map((account: any) => ({
        user_id: user.id,
        plaid_account_id: account.account_id,
        plaid_item_id: exchangeData.item_id,
        plaid_item_id_ref: exchangeData.item_id,
        account_id: account.account_id,
        name: account.name,
        official_name: account.official_name || account.name,
        type: account.type,
        subtype: account.subtype,
        mask: account.mask,
        available_balance: account.balances.available,
        current_balance: account.balances.current,
        balance: account.balances.current || account.balances.available || 0,
        credit_limit: account.balances.limit,
        currency_code: account.balances.iso_currency_code || 'USD',
        institution_id: accountsData.item?.institution_id,
        institution_name: body.institution_name || 'Connected Bank',
        source: 'plaid',
      }));

      accountsCount = await upsertAccounts(supabase, dbAccounts);
      logger.success(`Stored ${accountsCount} accounts`);
    }

    // 9. Fetch and store initial transactions (last 30 days)
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const transactionsData = await plaidClient.getTransactions(
        exchangeData.access_token,
        thirtyDaysAgo.toISOString().split('T')[0],
        new Date().toISOString().split('T')[0]
      );

      if (transactionsData.transactions && transactionsData.transactions.length > 0) {
        const dbTransactions: DatabaseTransaction[] = transactionsData.transactions.map((txn: any) => {
          const mappedCategory = mapPlaidCategory(txn.category || []);
          const hasPlaidCategory = txn.category && txn.category.length > 0;
          const categorySource = (hasPlaidCategory && mappedCategory !== 'Other') ? 'plaid' : 'auto';

          return {
            user_id: user.id,
            plaid_transaction_id: txn.transaction_id,
            plaid_account_id: txn.account_id,
            transaction_id: txn.transaction_id,
            amount: Math.abs(txn.amount),
            date: txn.date,
            datetime: txn.datetime || null,
            authorized_date: txn.authorized_date || null,
            authorized_datetime: txn.authorized_datetime || null,
            description: txn.name || txn.merchant_name || 'Unknown Transaction',
            merchant_name: txn.merchant_name,
            category: mappedCategory,
            category_source: categorySource,
            subcategory: txn.category?.[1] || null,
            pending: txn.pending || false,
            iso_currency_code: txn.iso_currency_code || 'USD',
            unofficial_currency_code: txn.unofficial_currency_code,
            location: txn.location || null,
            payment_meta: txn.payment_meta || null,
            plaid_category: txn.category?.[0] || null,
          };
        });

        transactionsCount = await upsertTransactions(supabase, dbTransactions);
        logger.success(`Stored ${transactionsCount} transactions`);
      }
    } catch (error) {
      logger.warn('Failed to fetch initial transactions', error);
      // Don't fail the entire process
    }

    // 10. Log successful exchange
    await logAudit(supabase, {
      user_id: user.id,
      access_type: 'encrypt',
      function_name: 'plaid-link-exchange',
      ip_address: getClientIP(req),
      user_agent: req.headers.get('user-agent') || 'unknown',
      success: true,
    });

    logger.success('Bank connection completed', {
      userId: user.id,
      accounts: accountsCount,
      transactions: transactionsCount,
    });

    return successResponse({
      success: true,
      message: 'Bank account connected successfully',
      hasPlaidConnection: true,
      saved: true,
      accounts: accountsCount,
      transactions: transactionsCount,
    });

  } catch (error) {
    logger.error('Token exchange failed', error);
    
    return errorResponse(
      error instanceof Error 
        ? error.message 
        : 'Failed to connect bank account. Please try again or contact support.',
      500
    );
  }
});

