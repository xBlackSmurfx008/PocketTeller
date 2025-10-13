import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import Stripe from 'https://esm.sh/stripe@14.11.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Stripe
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY') || Deno.env.get('STRIPE_SECRET_KEY_TEST');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not configured');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Initialize Supabase with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      throw new Error('No Stripe signature found');
    }

    // Verify webhook signature
    let event: Stripe.Event;
    
    if (webhookSecret) {
      try {
        event = await stripe.webhooks.constructEventAsync(
          body,
          signature,
          webhookSecret
        );
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return new Response(
          JSON.stringify({ error: 'Webhook signature verification failed' }),
          { status: 400, headers: corsHeaders }
        );
      }
    } else {
      // In development without webhook secret, parse body
      console.warn('No webhook secret configured, skipping signature verification');
      event = JSON.parse(body);
    }

    console.log('Processing Stripe event:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Checkout session completed:', session.id);

        // Get subscription details
        if (session.subscription && typeof session.subscription === 'string') {
          const subscription = await stripe.subscriptions.retrieve(session.subscription);
          await handleSubscriptionCreated(supabase, subscription, session.metadata?.user_id);
        }
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(supabase, subscription);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(supabase, subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabase, subscription);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(supabase, invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(supabase, invoice);
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    // Log the event
    await logEvent(supabase, event);

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper functions

async function handleSubscriptionCreated(
  supabase: any,
  subscription: Stripe.Subscription,
  userId?: string
) {
  console.log('Handling subscription created:', subscription.id);

  // Get user ID from metadata or customer
  const targetUserId = userId || subscription.metadata.user_id;
  
  if (!targetUserId) {
    console.error('No user_id found in subscription metadata');
    return;
  }

  // Get price details
  const price = subscription.items.data[0]?.price;
  const planType = subscription.metadata.plan_type || 
    (price?.recurring?.interval === 'year' ? 'yearly' : 'monthly');

  // Upsert subscription
  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: targetUserId,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      stripe_price_id: price?.id,
      status: subscription.status,
      plan_type: planType,
      plan_name: price?.nickname || `PocketTeller Pro - ${planType}`,
      amount_cents: price?.unit_amount || 0,
      currency: price?.currency || 'usd',
      interval: price?.recurring?.interval || 'month',
      trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      metadata: subscription.metadata,
    }, {
      onConflict: 'stripe_subscription_id',
    });

  if (error) {
    console.error('Error upserting subscription:', error);
  } else {
    console.log('Subscription created in database');
  }
}

async function handleSubscriptionUpdated(
  supabase: any,
  subscription: Stripe.Subscription
) {
  console.log('Handling subscription updated:', subscription.id);

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at 
        ? new Date(subscription.canceled_at * 1000).toISOString() 
        : null,
      ended_at: subscription.ended_at 
        ? new Date(subscription.ended_at * 1000).toISOString() 
        : null,
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error updating subscription:', error);
  } else {
    console.log('Subscription updated in database');
  }
}

async function handleSubscriptionDeleted(
  supabase: any,
  subscription: Stripe.Subscription
) {
  console.log('Handling subscription deleted:', subscription.id);

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      ended_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error deleting subscription:', error);
  } else {
    console.log('Subscription marked as canceled in database');
  }
}

async function handleInvoicePaid(
  supabase: any,
  invoice: Stripe.Invoice
) {
  console.log('Handling invoice paid:', invoice.id);

  // Update subscription status to active if it was past_due
  if (invoice.subscription) {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
      })
      .eq('stripe_subscription_id', invoice.subscription)
      .eq('status', 'past_due');

    if (!error) {
      console.log('Subscription reactivated after payment');
    }
  }
}

async function handlePaymentFailed(
  supabase: any,
  invoice: Stripe.Invoice
) {
  console.log('Handling payment failed:', invoice.id);

  // Update subscription status to past_due
  if (invoice.subscription) {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'past_due',
      })
      .eq('stripe_subscription_id', invoice.subscription);

    if (!error) {
      console.log('Subscription marked as past_due');
    }

    // TODO: Send email notification to user about failed payment
  }
}

async function logEvent(supabase: any, event: Stripe.Event) {
  // Get user_id from event metadata if available
  let userId: string | null = null;
  
  const eventObject = event.data.object as any;
  userId = eventObject.metadata?.user_id || null;

  // If no user_id in metadata, try to get from subscription
  if (!userId && eventObject.subscription) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', eventObject.subscription)
      .single();
    
    userId = sub?.user_id || null;
  }

  // Log the event
  await supabase.from('subscription_events').insert({
    user_id: userId,
    event_type: event.type,
    event_data: event.data.object,
    stripe_event_id: event.id,
    processed: true,
  });
}

