import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDemo } from '@/hooks/useDemo';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/integrations/supabase/client';
import { Transaction } from '@/types/models';
import { normalizeError, getUserErrorMessage, logError } from '@/utils/errorHandler';

/**
 * Result of a transaction operation
 */
interface TransactionOperationResult {
  success: boolean;
  error?: string;
}

/**
 * Hook for managing transactions
 * Provides CRUD operations for transactions with real-time updates
 * @returns Transaction state and operations
 */
export const useTransactions = () => {
  const { user } = useAuth();
  const { isDemo, sampleData } = useDemo();
  const { toast } = useToast();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch transactions with standardized options
   * includePending: whether to include pending transactions (default false)
   * accountId: optional plaid_account_id to filter by account
   */
  const fetchTransactions = useCallback(async (
    options: { includePending?: boolean; accountId?: string | null } = {}
  ) => {
    setLoading(true);
    setError(null);

    if (isDemo) {
      // Use demo data
      // Map demo data to Transaction shape when necessary
      const demoTxns = (sampleData.transactions || []).map((t: any) => ({
        id: t.id || t.transaction_id || Math.random().toString(),
        date: t.date,
        description: t.name || t.description,
        amount: typeof t.amount === 'number' ? t.amount : Number(t.amount),
        category: Array.isArray(t.category) ? (t.category[0] || 'Other') : (t.category || 'Other'),
        account_id: t.account_id,
        plaid_account_id: t.account_id,
        merchant_name: t.merchant_name,
        pending: !!t.pending,
      }));
      setTransactions(demoTxns);
      setLoading(false);
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      // Default exclude pending unless explicitly included
      const includePending = options.includePending ?? false;
      if (!includePending) {
        query = query.eq('pending', false);
      }

      if (options.accountId) {
        query = query.eq('plaid_account_id', options.accountId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setTransactions(data || []);
    } catch (err) {
      const errorMessage = getUserErrorMessage(err, 'Failed to fetch transactions');
      setError(errorMessage);
      logError(err, 'useTransactions.fetchTransactions');
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, isDemo, sampleData, toast]);

  /**
   * Updates a transaction
   * @param id - Transaction ID to update
   * @param updates - Partial transaction object with fields to update
   * @returns Operation result with success status and optional error
   */
  const updateTransaction = useCallback(async (
    id: string, 
    updates: Partial<Transaction>
  ): Promise<TransactionOperationResult> => {
    if (isDemo) {
      setTransactions(prev => 
        prev.map(t => t.id === id ? { ...t, ...updates } : t)
      );
      return { success: true };
    }

    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setTransactions(prev => 
        prev.map(t => t.id === id ? { ...t, ...updates } : t)
      );

      return { success: true };
    } catch (err) {
      const errorMessage = getUserErrorMessage(err, 'Failed to update transaction');
      logError(err, 'useTransactions.updateTransaction');
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  }, [user, isDemo, toast]);

  /**
   * Deletes a transaction
   * @param id - Transaction ID to delete
   * @returns Operation result with success status and optional error
   */
  const deleteTransaction = useCallback(async (id: string): Promise<TransactionOperationResult> => {
    if (isDemo) {
      setTransactions(prev => prev.filter(t => t.id !== id));
      return { success: true };
    }

    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setTransactions(prev => prev.filter(t => t.id !== id));

      return { success: true };
    } catch (err) {
      const errorMessage = getUserErrorMessage(err, 'Failed to delete transaction');
      logError(err, 'useTransactions.deleteTransaction');
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  }, [user, isDemo, toast]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions,
    updateTransaction,
    deleteTransaction
  };
};