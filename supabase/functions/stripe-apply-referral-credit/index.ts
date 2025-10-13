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

    // Get request data
    const { suggestions } = await req.json();

    if (!Array.isArray(suggestions) || suggestions.length < 3) {
      throw new Error('Must provide at least 3 suggestions to earn referral credit');
    }

    // Validate suggestions
    for (const suggestion of suggestions) {
      if (!suggestion.title || !suggestion.description) {
        throw new Error('Each suggestion must have a title and description');
      }
    }

    // Get user's current subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (subError) {
      throw new Error('No active subscription found');
    }

    // Check if user already used referral credit recently (prevent abuse)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentEvents } = await supabase
      .from('subscription_events')
      .select('id')
      .eq('user_id', user.id)
      .eq('event_type', 'referral.credit_applied')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (recentEvents && recentEvents.length > 0) {
      throw new Error('You can only earn referral credits once per month');
    }

    // Store suggestions
    const { error: suggestionError } = await supabase
      .from('user_suggestions')
      .insert(
        suggestions.map((s: any) => ({
          user_id: user.id,
          title: s.title,
          description: s.description,
          category: s.category || 'general',
          status: 'pending',
        }))
      );

    if (suggestionError) {
      console.error('Error storing suggestions:', suggestionError);
      throw new Error('Failed to store suggestions');
    }

    // Increment referral credits
    const newReferralCredits = (subscription.referral_credits || 0) + 1;
    
    // Every 1 referral credit = 1 free month
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        referral_credits: newReferralCredits,
        free_months_remaining: (subscription.free_months_remaining || 0) + 1,
      })
      .eq('user_id', user.id);

    if (updateError) {
      throw new Error('Failed to apply referral credit');
    }

    // Log the event
    await supabase.from('subscription_events').insert({
      user_id: user.id,
      subscription_id: subscription.id,
      event_type: 'referral.credit_applied',
      event_data: {
        suggestions_count: suggestions.length,
        credit_number: newReferralCredits,
      },
    });

    console.log(`Referral credit applied for user ${user.id}. Total credits: ${newReferralCredits}`);

    return new Response(
      JSON.stringify({
        success: true,
        referralCredits: newReferralCredits,
        freeMonthsRemaining: (subscription.free_months_remaining || 0) + 1,
        message: '🎉 Thank you! You earned 1 free month for your suggestions!',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error applying referral credit:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to apply referral credit',
        success: false,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

