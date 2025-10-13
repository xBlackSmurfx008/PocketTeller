import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import Stripe from 'https://esm.sh/stripe@14.11.0?target=deno';

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
    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || Deno.env.get('STRIPE_SECRET_KEY_TEST');
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not configured');
    }
    
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

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
    const { planType, promoCode, successUrl, cancelUrl } = await req.json();

    // Validate plan type
    if (!['monthly', 'yearly'].includes(planType)) {
      throw new Error('Invalid plan type. Must be "monthly" or "yearly"');
    }

    // Get user email
    const userEmail = user.email || '';
    
    // Get or create Stripe customer
    let stripeCustomerId: string;
    
    // Check if user already has a Stripe customer ID
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    if (existingSubscription?.stripe_customer_id) {
      stripeCustomerId = existingSubscription.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          supabase_user_id: user.id,
          app: 'PocketTeller',
        },
      });
      stripeCustomerId = customer.id;
    }

    // Determine price ID
    const priceId = planType === 'monthly'
      ? Deno.env.get('STRIPE_PRICE_MONTHLY')
      : Deno.env.get('STRIPE_PRICE_YEARLY');

    if (!priceId) {
      throw new Error(`Price ID not configured for ${planType} plan`);
    }

    // Create checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl || `${req.headers.get('origin')}/settings?checkout=success`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/settings?checkout=canceled`,
      metadata: {
        user_id: user.id,
        plan_type: planType,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan_type: planType,
        },
        trial_period_days: 30, // First month free
      },
      allow_promotion_codes: true,
    };

    // Apply promo code if provided
    if (promoCode) {
      // Validate promo code exists
      const promoCodes = await stripe.promotionCodes.list({
        code: promoCode,
        active: true,
        limit: 1,
      });

      if (promoCodes.data.length > 0) {
        sessionParams.discounts = [
          {
            promotion_code: promoCodes.data[0].id,
          },
        ];
      } else {
        console.warn(`Promo code ${promoCode} not found or inactive`);
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    // Log checkout session creation
    await supabase.from('subscription_events').insert({
      user_id: user.id,
      event_type: 'checkout.session.created',
      event_data: {
        session_id: session.id,
        plan_type: planType,
        promo_code: promoCode || null,
      },
    });

    console.log('Checkout session created:', session.id);

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to create checkout session',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

