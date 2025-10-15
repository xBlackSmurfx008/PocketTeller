/**
 * Shared database utilities for Plaid Edge Functions
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import type {
  PlaidItemRecord,
  DatabaseAccount,
  DatabaseTransaction,
  AuditLogEntry,
} from './plaid-types.ts';
import { logger } from './plaid-utils.ts';

/**
 * Create Supabase client with service role
 */
export function createServiceClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Get authenticated user from request
 */
export async function getAuthenticatedUser(
  supabase: SupabaseClient,
  authHeader: string | null
): Promise<{ id: string; email?: string }> {
  if (!authHeader) {
    throw new Error('No authorization header');
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new Error('Invalid auth token');
  }

  return user;
}

/**
 * Check rate limiting for a user
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  userId: string,
  rpcFunction: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .rpc(rpcFunction, { target_user_id: userId });

    if (error) {
      logger.warn('Rate limit check failed, allowing request', error);
      return true; // Allow on error to not block legitimate users
    }

    return !!data;
  } catch (error) {
    logger.warn('Rate limit check exception, allowing request', error);
    return true;
  }
}

/**
 * Log audit entry
 */
export async function logAudit(
  supabase: SupabaseClient,
  entry: AuditLogEntry
): Promise<void> {
  try {
    const { error } = await supabase
      .from('plaid_token_audit_log')
      .insert(entry);

    if (error) {
      logger.error('Failed to log audit entry', error);
    }
  } catch (error) {
    logger.error('Audit logging exception', error);
  }
}

/**
 * Encrypt Plaid token
 */
export async function encryptPlaidToken(
  supabase: SupabaseClient,
  token: string,
  encryptionKey: string
): Promise<{ encrypted_token: string; iv: string; key_hint: string }> {
  const { data, error } = await supabase.rpc('encrypt_plaid_token', {
    token,
    encryption_key: encryptionKey,
  });

  if (error || !data) {
    logger.error('Token encryption failed', error);
    throw new Error('Failed to encrypt token');
  }

  return data;
}

/**
 * Decrypt Plaid token with audit logging
 */
export async function decryptPlaidToken(
  supabase: SupabaseClient,
  encryptedData: { encrypted_token: string; iv: string },
  encryptionKey: string,
  auditInfo: {
    functionName: string;
    ipAddress: string | null;
    userAgent: string;
    userId: string;
  }
): Promise<string> {
  const { data, error } = await supabase.rpc('decrypt_plaid_token_with_audit', {
    encrypted_data: encryptedData,
    encryption_key: encryptionKey,
    function_name: auditInfo.functionName,
    ip_address: auditInfo.ipAddress,
    user_agent: auditInfo.userAgent,
    target_user_id: auditInfo.userId,
  });

  if (error || !data) {
    logger.error('Token decryption failed', error);
    throw new Error('Failed to decrypt token');
  }

  return data;
}

/**
 * Get user's encrypted Plaid token
 */
export async function getUserPlaidToken(
  supabase: SupabaseClient,
  userId: string
): Promise<{ encrypted_token: string; iv: string } | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('encrypted_plaid_token, token_iv')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data?.encrypted_plaid_token) {
    return null;
  }

  return {
    encrypted_token: data.encrypted_plaid_token,
    iv: data.token_iv,
  };
}

/**
 * Store encrypted Plaid token
 */
export async function storePlaidToken(
  supabase: SupabaseClient,
  userId: string,
  encryptedData: { encrypted_token: string; iv: string }
): Promise<void> {
  // Try update first
  const { data: updateResult, error: updateError } = await supabase
    .from('profiles')
    .update({
      encrypted_plaid_token: encryptedData.encrypted_token,
      token_iv: encryptedData.iv,
      last_token_rotation: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select('user_id');

  // If no rows updated, create profile
  if (!updateError && (!updateResult || updateResult.length === 0)) {
    const { error: insertError } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        app_id: 'budget-ai',
        encrypted_plaid_token: encryptedData.encrypted_token,
        token_iv: encryptedData.iv,
        last_token_rotation: new Date().toISOString(),
      });

    if (insertError) {
      throw new Error('Failed to create user profile');
    }
  } else if (updateError) {
    throw new Error('Failed to store access token');
  }

  // Verify token was saved
  const { data: verifyProfile, error: verifyError } = await supabase
    .from('profiles')
    .select('encrypted_plaid_token')
    .eq('user_id', userId)
    .single();

  if (verifyError || !verifyProfile?.encrypted_plaid_token) {
    throw new Error('Token save verification failed');
  }
}

/**
 * Clear Plaid token from user profile
 */
export async function clearPlaidToken(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({
      encrypted_plaid_token: null,
      token_iv: null,
      last_token_rotation: new Date().toISOString(),
    })
    .eq('user_id', userId);

  if (error) {
    throw new Error('Failed to clear stored token');
  }
}

/**
 * Upsert Plaid item
 */
export async function upsertPlaidItem(
  supabase: SupabaseClient,
  item: PlaidItemRecord
): Promise<void> {
  const { error } = await supabase
    .from('plaid_items')
    .upsert(item, { onConflict: 'item_id' });

  if (error) {
    logger.error('Failed to upsert Plaid item', error);
    throw new Error('Failed to store Plaid item metadata');
  }
}

/**
 * Get Plaid item for user
 */
export async function getPlaidItem(
  supabase: SupabaseClient,
  userId: string
): Promise<any | null> {
  const { data, error } = await supabase
    .from('plaid_items')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    logger.error('Error fetching Plaid item', error);
    return null;
  }

  return data;
}

/**
 * Update Plaid item sync cursor
 */
export async function updateSyncCursor(
  supabase: SupabaseClient,
  itemId: string,
  cursor: string
): Promise<void> {
  const { error } = await supabase
    .from('plaid_items')
    .update({
      sync_cursor: cursor,
      last_synced_at: new Date().toISOString(),
    })
    .eq('id', itemId);

  if (error) {
    logger.warn('Failed to update sync cursor', error);
  }
}

/**
 * Batch upsert accounts
 */
export async function upsertAccounts(
  supabase: SupabaseClient,
  accounts: DatabaseAccount[]
): Promise<number> {
  const { data, error } = await supabase
    .from('accounts')
    .upsert(accounts, {
      onConflict: 'user_id,plaid_account_id',
      ignoreDuplicates: false,
    })
    .select();

  if (error) {
    logger.error('Failed to upsert accounts', error);
    throw new Error('Failed to store accounts');
  }

  return data?.length || 0;
}

/**
 * Batch upsert transactions with user category rules applied
 */
export async function upsertTransactions(
  supabase: SupabaseClient,
  transactions: DatabaseTransaction[]
): Promise<number> {
  if (transactions.length === 0) return 0;

  // Apply user category rules for future transaction memory
  const merchantNames = transactions
    .map(t => t.merchant_name)
    .filter(Boolean) as string[];

  if (merchantNames.length > 0) {
    try {
      const { data: categoryRules } = await supabase
        .from('user_category_rules')
        .select('merchant_name, category')
        .eq('user_id', transactions[0].user_id)
        .in('merchant_name', merchantNames);

      if (categoryRules && categoryRules.length > 0) {
        // Apply user rules to matching transactions (user category > plaid > auto)
        const rulesMap = new Map(categoryRules.map(r => [r.merchant_name, r.category]));
        
        transactions = transactions.map(txn => {
          if (txn.merchant_name && rulesMap.has(txn.merchant_name)) {
            // User has a saved rule for this merchant - ALWAYS apply it
            return {
              ...txn,
              category: rulesMap.get(txn.merchant_name)!,
              category_source: 'user'  // User's preference is highest priority
            };
          }
          return txn;
        });

        logger.info(`Applied ${categoryRules.length} user category rules`);
      }
    } catch (error) {
      logger.warn('Failed to apply category rules', error);
      // Continue with upsert even if rule application fails
    }
  }

  const { data, error } = await supabase
    .from('transactions')
    .upsert(transactions, {
      onConflict: 'user_id,plaid_transaction_id',
      ignoreDuplicates: false,
    })
    .select();

  if (error) {
    logger.error('Failed to upsert transactions', error);
    throw new Error('Failed to store transactions');
  }

  return data?.length || 0;
}

/**
 * Delete transactions by IDs
 */
export async function deleteTransactions(
  supabase: SupabaseClient,
  userId: string,
  transactionIds: string[]
): Promise<void> {
  if (transactionIds.length === 0) return;

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('user_id', userId)
    .in('plaid_transaction_id', transactionIds);

  if (error) {
    logger.warn('Failed to delete transactions', error);
  }
}

