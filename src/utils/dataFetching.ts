/**
 * Common data fetching patterns and utilities
 * Reduces code duplication across hooks
 */

import { supabase } from '@/integrations/supabase/client';
import { QueryResponse } from '@/types/api';
import { normalizeError, logError } from './errorHandler';

/**
 * Generic fetch function for Supabase queries
 * @param table - Database table name
 * @param userId - User ID for filtering
 * @param options - Additional query options
 * @returns Query response with data or error
 */
export async function fetchUserData<T>(
  table: string,
  userId: string,
  options: {
    select?: string;
    filter?: Record<string, unknown>;
    orderBy?: { column: string; ascending?: boolean };
    limit?: number;
    single?: boolean;
  } = {}
): Promise<QueryResponse<T | T[]>> {
  try {
    let query = supabase
      .from(table)
      .select(options.select || '*')
      .eq('user_id', userId);

    // Apply additional filters
    if (options.filter) {
      Object.entries(options.filter).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    // Apply ordering
    if (options.orderBy) {
      query = query.order(options.orderBy.column, {
        ascending: options.orderBy.ascending ?? true
      });
    }

    // Apply limit
    if (options.limit) {
      query = query.limit(options.limit);
    }

    // Execute query
    const result = options.single
      ? await query.maybeSingle()
      : await query;

    return {
      data: result.data as T | T[],
      error: result.error || null,
      count: 'count' in result ? result.count || undefined : undefined
    };
  } catch (error) {
    logError(error, `fetchUserData: ${table}`);
    return {
      data: null,
      error: normalizeError(error)
    };
  }
}

/**
 * Generic create function for Supabase inserts
 * @param table - Database table name
 * @param data - Data to insert
 * @returns Query response with created data or error
 */
export async function createRecord<T>(
  table: string,
  data: Partial<T>
): Promise<QueryResponse<T>> {
  try {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select()
      .single();

    return {
      data: result as T,
      error: error || null
    };
  } catch (error) {
    logError(error, `createRecord: ${table}`);
    return {
      data: null,
      error: normalizeError(error)
    };
  }
}

/**
 * Generic update function for Supabase updates
 * @param table - Database table name
 * @param id - Record ID
 * @param userId - User ID for authorization
 * @param updates - Fields to update
 * @returns Query response with updated data or error
 */
export async function updateRecord<T>(
  table: string,
  id: string,
  userId: string,
  updates: Partial<T>
): Promise<QueryResponse<T>> {
  try {
    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    return {
      data: data as T,
      error: error || null
    };
  } catch (error) {
    logError(error, `updateRecord: ${table}`);
    return {
      data: null,
      error: normalizeError(error)
    };
  }
}

/**
 * Generic delete function for Supabase deletes
 * @param table - Database table name
 * @param id - Record ID
 * @param userId - User ID for authorization
 * @returns Query response with error if any
 */
export async function deleteRecord(
  table: string,
  id: string,
  userId: string
): Promise<QueryResponse<null>> {
  try {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    return {
      data: null,
      error: error || null
    };
  } catch (error) {
    logError(error, `deleteRecord: ${table}`);
    return {
      data: null,
      error: normalizeError(error)
    };
  }
}

/**
 * Subscribes to real-time changes for a table
 * @param table - Database table name
 * @param userId - User ID for filtering
 * @param callback - Callback function to execute on changes
 * @returns Cleanup function to unsubscribe
 */
export function subscribeToTableChanges(
  table: string,
  userId: string,
  callback: () => void
): () => void {
  const channel = supabase
    .channel(`${table}-changes-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table,
        filter: `user_id=eq.${userId}`
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Batches multiple operations to execute in sequence
 * @param operations - Array of async operations to execute
 * @returns Array of results from each operation
 */
export async function batchOperations<T>(
  operations: (() => Promise<T>)[]
): Promise<T[]> {
  const results: T[] = [];
  
  for (const operation of operations) {
    try {
      const result = await operation();
      results.push(result);
    } catch (error) {
      logError(error, 'batchOperations');
      throw error;
    }
  }
  
  return results;
}

/**
 * Executes operations in parallel with error handling
 * @param operations - Array of async operations to execute
 * @returns Array of results or errors
 */
export async function parallelOperations<T>(
  operations: (() => Promise<T>)[]
): Promise<(T | Error)[]> {
  return Promise.allSettled(operations.map(op => op())).then(results =>
    results.map(result =>
      result.status === 'fulfilled' ? result.value : result.reason
    )
  );
}

