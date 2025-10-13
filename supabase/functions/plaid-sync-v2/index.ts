/**
 * Plaid Sync (Refactored)
 * Syncs transactions and accounts using cursor-based incremental updates
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
import type { DatabaseAccount, DatabaseTransaction } from '../_shared/plaid-types.ts';
import {
  createServiceClient,
  getAuthenticatedUser,
  checkRateLimit,
  getUserPlaidToken,
  decryptPlaidToken,
  getPlaidItem,
  upsertPlaidItem,
  upsertAccounts,
  updateSyncCursor,
  deleteTransactions,
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

    logger.info('Sync request', { userId: user.id });

    // 3. Get encrypted access token
    const encryptedToken = await getUserPlaidToken(supabase, user.id);
    if (!encryptedToken) {
      return errorResponse('No Plaid access token found', 404);
    }

    // 4. Check rate limiting
    const canProceed = await checkRateLimit(
      supabase,
      user.id,
      'check_token_access_rate'
    );

    if (!canProceed) {
      logger.warn('Rate limit exceeded', { userId: user.id });
      return errorResponse(
        'Too many sync attempts. Please try again later.',
        429
      );
    }

    // 5. Decrypt access token
    const decryptedToken = await decryptPlaidToken(
      supabase,
      encryptedToken,
      config.encryptionKey!,
      {
        functionName: 'plaid-sync',
        ipAddress: getClientIP(req),
        userAgent: req.headers.get('user-agent') || 'unknown',
        userId: user.id,
      }
    );

    // 6. Initialize Plaid API client
    const plaidClient = new PlaidAPIClient(
      plaidBaseUrl,
      config.clientId!,
      config.secret!
    );

    // 7. Get accounts from Plaid
    logger.info('Fetching accounts from Plaid');
    const accountsData = await plaidClient.getAccounts(decryptedToken);

    // 8. Update Plaid item metadata
    let plaidItem = await getPlaidItem(supabase, user.id);

    if (accountsData.item) {
      await upsertPlaidItem(supabase, {
        user_id: user.id,
        item_id: accountsData.item.item_id,
        institution_id: accountsData.item.institution_id,
        institution_name: accountsData.accounts?.[0]?.name?.split(' - ')?.[0] || 'Connected Bank',
        available_products: accountsData.item.available_products || [],
        billed_products: accountsData.item.billed_products || [],
        products: accountsData.item.products || [],
        update_type: 'sync',
        last_synced_at: new Date().toISOString(),
        sync_cursor: plaidItem?.sync_cursor,
      });

      // Refresh plaid item
      plaidItem = await getPlaidItem(supabase, user.id);
    }

    // 9. Sync accounts
    logger.info('Syncing accounts');
    const dbAccounts: DatabaseAccount[] = accountsData.accounts.map((account: any) => ({
      user_id: user.id,
      account_id: account.account_id,
      plaid_account_id: account.account_id,
      plaid_item_id_ref: accountsData.item?.item_id,
      name: account.name,
      official_name: account.official_name || account.name,
      type: account.type,
      subtype: account.subtype,
      mask: account.mask,
      balance: account.balances.current || account.balances.available || 0,
      available_balance: account.balances.available,
      current_balance: account.balances.current,
      credit_limit: account.balances.limit,
      currency_code: account.balances.iso_currency_code || 'USD',
      institution_id: accountsData.item?.institution_id,
      source: 'plaid',
    }));

    const syncedAccounts = await upsertAccounts(supabase, dbAccounts);
    logger.success(`Synced ${syncedAccounts} accounts`);

    // 10. Sync transactions using cursor
    logger.info('Syncing transactions');
    let totalSyncedTransactions = 0;
    let hasMore = true;
    let cursor = plaidItem?.sync_cursor;

    while (hasMore) {
      const syncData = await plaidClient.syncTransactions(decryptedToken, cursor);

      // Process added transactions
      if (syncData.added && syncData.added.length > 0) {
        const addedTransactions: DatabaseTransaction[] = syncData.added.map((txn: any) => {
          const mappedCategory = mapPlaidCategory(txn.category || []);
          const hasPlaidCategory = txn.category && txn.category.length > 0;
          const categorySource = (hasPlaidCategory && mappedCategory !== 'Other') ? 'plaid' : 'auto';

          return {
            user_id: user.id,
            transaction_id: txn.transaction_id,
            plaid_transaction_id: txn.transaction_id,
            plaid_account_id: txn.account_id,
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

        const addedCount = await upsertTransactions(supabase, addedTransactions);
        totalSyncedTransactions += addedCount;
        logger.info(`Added ${addedCount} new transactions`);
      }

      // Process modified transactions
      if (syncData.modified && syncData.modified.length > 0) {
        // For modified transactions, we respect the category priority:
        // user > plaid > ai > auto
        const modifiedTransactions = await Promise.all(
          syncData.modified.map(async (txn: any) => {
            // Check existing categorization
            const { data: existingTxn } = await supabase
              .from('transactions')
              .select('category_source, category')
              .eq('user_id', user.id)
              .eq('plaid_transaction_id', txn.transaction_id)
              .single();

            const mappedCategory = mapPlaidCategory(txn.category || []);
            const hasPlaidCategory = txn.category && txn.category.length > 0;
            const isPlaidCategoryGood = hasPlaidCategory && mappedCategory !== 'Other';

            let category = mappedCategory;
            let categorySource: 'user' | 'plaid' | 'ai' | 'auto' = 'auto';

            if (existingTxn?.category_source === 'user') {
              // Never overwrite user's manual categorization
              category = existingTxn.category;
              categorySource = 'user';
            } else if (isPlaidCategoryGood) {
              // Use Plaid's good category
              categorySource = 'plaid';
            } else if (existingTxn?.category_source === 'ai') {
              // Keep AI categorization if Plaid has no good data
              category = existingTxn.category;
              categorySource = 'ai';
            } else {
              categorySource = 'auto';
            }

            return {
              user_id: user.id,
              transaction_id: txn.transaction_id,
              plaid_transaction_id: txn.transaction_id,
              plaid_account_id: txn.account_id,
              amount: Math.abs(txn.amount),
              date: txn.date,
              datetime: txn.datetime || null,
              authorized_date: txn.authorized_date || null,
              authorized_datetime: txn.authorized_datetime || null,
              description: txn.name || txn.merchant_name || 'Unknown Transaction',
              merchant_name: txn.merchant_name,
              category,
              category_source: categorySource,
              subcategory: txn.category?.[1] || null,
              pending: txn.pending || false,
              iso_currency_code: txn.iso_currency_code || 'USD',
              unofficial_currency_code: txn.unofficial_currency_code,
              location: txn.location || null,
              payment_meta: txn.payment_meta || null,
              plaid_category: txn.category?.[0] || null,
            };
          })
        );

        const modifiedCount = await upsertTransactions(supabase, modifiedTransactions);
        logger.info(`Updated ${modifiedCount} modified transactions`);
      }

      // Process removed transactions
      if (syncData.removed && syncData.removed.length > 0) {
        const removedIds = syncData.removed.map((t: any) => t.transaction_id);
        await deleteTransactions(supabase, user.id, removedIds);
        logger.info(`Removed ${removedIds.length} transactions`);
      }

      // Update cursor and check if more data exists
      cursor = syncData.next_cursor;
      hasMore = syncData.has_more;

      // Update sync cursor in database
      if (plaidItem) {
        await updateSyncCursor(supabase, plaidItem.id, cursor);
      }
    }

    logger.success('Sync completed', {
      userId: user.id,
      accounts: syncedAccounts,
      transactions: totalSyncedTransactions,
    });

    return successResponse({
      success: true,
      accounts: syncedAccounts,
      transactions: totalSyncedTransactions,
      cursor_updated: !!cursor,
    });

  } catch (error) {
    logger.error('Sync failed', error);
    
    return errorResponse(
      error instanceof Error 
        ? error.message 
        : 'Sync failed. Please try again or contact support if the issue persists.',
      500
    );
  }
});

