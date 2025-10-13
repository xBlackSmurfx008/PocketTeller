import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './useToast';

export interface SubscriptionStatus {
  hasSubscription: boolean;
  isActive: boolean;
  isPro: boolean;
  status: string;
  planType: string | null;
  trialDaysRemaining: number;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  freeMonthsRemaining: number;
  referralCredits: number;
}

export function useSubscription() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    hasSubscription: false,
    isActive: false,
    isPro: false,
    status: 'none',
    planType: null,
    trialDaysRemaining: 0,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    freeMonthsRemaining: 0,
    referralCredits: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkSubscription = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase.functions.invoke(
        'stripe-check-subscription'
      );

      if (fetchError) {
        throw fetchError;
      }

      setSubscription(data || {
        hasSubscription: false,
        isActive: false,
        isPro: false,
        status: 'none',
        planType: null,
        trialDaysRemaining: 0,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        freeMonthsRemaining: 0,
        referralCredits: 0,
      });
    } catch (err: any) {
      console.error('Error checking subscription:', err);
      setError(err.message || 'Failed to check subscription');
      
      // Set default values on error
      setSubscription({
        hasSubscription: false,
        isActive: false,
        isPro: false,
        status: 'none',
        planType: null,
        trialDaysRemaining: 0,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        freeMonthsRemaining: 0,
        referralCredits: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const createCheckoutSession = async (
    planType: 'monthly' | 'yearly',
    promoCode?: string
  ) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to subscribe',
        variant: 'destructive',
      });
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('stripe-create-checkout', {
        body: {
          planType,
          promoCode: promoCode || undefined,
          successUrl: `${window.location.origin}/subscription?checkout=success`,
          cancelUrl: `${window.location.origin}/subscription?checkout=canceled`,
        },
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (err: any) {
      console.error('Error creating checkout session:', err);
      toast({
        title: 'Checkout error',
        description: err.message || 'Failed to create checkout session',
        variant: 'destructive',
      });
      return null;
    }
  };

  const openCustomerPortal = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to manage your subscription',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('stripe-create-portal', {
        body: {
          returnUrl: `${window.location.origin}/account`,
        },
      });

      if (error) {
        throw error;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error('Error opening customer portal:', err);
      toast({
        title: 'Portal error',
        description: err.message || 'Failed to open billing portal',
        variant: 'destructive',
      });
    }
  };

  const submitSuggestions = async (suggestions: Array<{ title: string; description: string; category?: string }>) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to submit suggestions',
        variant: 'destructive',
      });
      return false;
    }

    try {
      const { data, error } = await supabase.functions.invoke(
        'stripe-apply-referral-credit',
        {
          body: { suggestions },
        }
      );

      if (error) {
        throw error;
      }

      if (data?.success) {
        toast({
          title: '🎉 Thank you!',
          description: data.message || 'You earned 1 free month!',
        });
        
        // Refresh subscription status
        await checkSubscription();
        return true;
      }

      return false;
    } catch (err: any) {
      console.error('Error submitting suggestions:', err);
      toast({
        title: 'Submission error',
        description: err.message || 'Failed to submit suggestions',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    checkSubscription();
  }, [user]);

  return {
    ...subscription,
    loading,
    error,
    refresh: checkSubscription,
    createCheckoutSession,
    openCustomerPortal,
    submitSuggestions,
  };
}

