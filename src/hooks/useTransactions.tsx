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

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (isDemo) {
      // Use demo data
      setTransactions(sampleData.transactions || []);
      setLoading(false);
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

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