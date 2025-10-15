import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Get user's subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subError && subError.code !== 'PGRST116') {
      console.error('Error fetching subscription:', subError);
      throw new Error('Failed to fetch subscription');
    }

    // Determine subscription status
    const now = new Date();
    let isActive = false;
    let isPro = false;
    let trialDaysRemaining = 0;
    let isTrialExpired = false;

    if (subscription) {
      // Check if subscription is active
      isActive = ['active', 'trialing'].includes(subscription.status) &&
        (!subscription.current_period_end || new Date(subscription.current_period_end) > now);

      isPro = isActive;

      // Calculate trial days remaining
      if (subscription.status === 'trialing' && subscription.trial_end) {
        const trialEnd = new Date(subscription.trial_end);
        const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        trialDaysRemaining = Math.max(0, daysRemaining);
        
        // Check if trial has expired
        if (trialEnd < now) {
          isTrialExpired = true;
          isPro = false;
          isActive = false;
        }
      }
      
      // Check if subscription ended without payment
      if (subscription.status === 'incomplete' || 
          subscription.status === 'incomplete_expired' ||
          subscription.status === 'canceled' ||
          subscription.status === 'unpaid') {
        isTrialExpired = true;
        isPro = false;
        isActive = false;
      }
    }

    return new Response(
      JSON.stringify({
        hasSubscription: !!subscription,
        isActive,
        isPro,
        isTrialExpired,
        status: subscription?.status || 'none',
        planType: subscription?.plan_type || null,
        trialDaysRemaining,
        trialEndDate: subscription?.trial_end || null,
        currentPeriodEnd: subscription?.current_period_end || null,
        cancelAtPeriodEnd: subscription?.cancel_at_period_end || false,
        freeMonthsRemaining: subscription?.free_months_remaining || 0,
        referralCredits: subscription?.referral_credits || 0,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error checking subscription:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to check subscription',
        hasSubscription: false,
        isActive: false,
        isPro: false,
        isTrialExpired: false,
      }),
      {
        status: 200, // Return 200 to avoid breaking the app
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

