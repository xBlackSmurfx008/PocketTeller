import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDemo } from '@/hooks/useDemo';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface Goal {
  id: string;
  goal_name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  created_at?: string;
  updated_at?: string;
}

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
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch goals';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, isDemo, sampleData, toast]);

  const createGoal = useCallback(async (goalData: Omit<Goal, 'id' | 'created_at' | 'updated_at'>) => {
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
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create goal';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  }, [user, isDemo, toast]);

  const updateGoal = useCallback(async (id: string, updates: Partial<Goal>) => {
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
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update goal';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      return { success: false, error: errorMessage };
    }
  }, [user, isDemo, toast]);

  const deleteGoal = useCallback(async (id: string) => {
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
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete goal';
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