import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDemo } from '@/hooks/useDemo';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/integrations/supabase/client';
import { Goal } from '@/types/models';
import { getUserErrorMessage, logError } from '@/utils/errorHandler';

export type { Goal };

/**
 * Operation result interface
 */
interface OperationResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Hook for managing financial goals
 * Provides CRUD operations for goals with real-time updates
 * @returns Goals state and operations
 */
export const useGoals = () => {
  const { user } = useAuth();
  const { isDemo, sampleData } = useDemo();
  const { toast } = useToast();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (isDemo) {
      // Use demo data
      setGoals(sampleData.goals || []);
      setLoading(false);
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setGoals(data || []);
    } catch (err) {
      const errorMessage = getUserErrorMessage(err, 'Failed to fetch goals');
      setError(errorMessage);
      logError(err, 'useGoals.fetchGoals');
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
   * Creates a new goal
   * @param goalData - Goal data without system-generated fields
   * @returns Operation result with created goal data
   */
  const createGoal = useCallback(async (
    goalData: Omit<Goal, 'id' | 'created_at' | 'updated_at'>
  ): Promise<OperationResult<Goal>> => {
    if (isDemo) {
      const newGoal: Goal = {
        ...goalData,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setGoals(prev => [newGoal, ...prev]);
      return { success: true, data: newGoal };
    }

    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const { data, error } = await supabase
        .from('goals')
        .insert({ ...goalData, user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      setGoals(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Goal created successfully",
      });

      return { success: true, data };
    } catch (err) {
      const errorMessage = getUserErrorMessage(err, 'Failed to create goal');
      logError(err, 'useGoals.createGoal');
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  }, [user, isDemo, toast]);

  /**
   * Updates an existing goal
   * @param id - Goal ID to update
   * @param updates - Partial goal object with fields to update
   * @returns Operation result
   */
  const updateGoal = useCallback(async (
    id: string, 
    updates: Partial<Goal>
  ): Promise<OperationResult> => {
    if (isDemo) {
      setGoals(prev => 
        prev.map(g => g.id === id ? { ...g, ...updates, updated_at: new Date().toISOString() } : g)
      );
      return { success: true };
    }

    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setGoals(prev => 
        prev.map(g => g.id === id ? { ...g, ...updates, updated_at: new Date().toISOString() } : g)
      );

      toast({
        title: "Success",
        description: "Goal updated successfully",
      });

      return { success: true };
    } catch (err) {
      const errorMessage = getUserErrorMessage(err, 'Failed to update goal');
      logError(err, 'useGoals.updateGoal');
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  }, [user, isDemo, toast]);

  /**
   * Deletes a goal
   * @param id - Goal ID to delete
   * @returns Operation result
   */
  const deleteGoal = useCallback(async (id: string): Promise<OperationResult> => {
    if (isDemo) {
      setGoals(prev => prev.filter(g => g.id !== id));
      return { success: true };
    }

    if (!user) return { success: false, error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setGoals(prev => prev.filter(g => g.id !== id));

      toast({
        title: "Success",
        description: "Goal deleted successfully",
      });

      return { success: true };
    } catch (err) {
      const errorMessage = getUserErrorMessage(err, 'Failed to delete goal');
      logError(err, 'useGoals.deleteGoal');
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  }, [user, isDemo, toast]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  return {
    goals,
    loading,
    error,
    refetch: fetchGoals,
    createGoal,
    updateGoal,
    deleteGoal
  };
};