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
    // Initialize Supabase with service role (bypasses RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔍 Checking for trials expiring in 14 days...');

    // Calculate the date 14 days from now
    const fourteenDaysFromNow = new Date();
    fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);
    
    // Get start and end of that day for precise matching
    const startOfDay = new Date(fourteenDaysFromNow);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(fourteenDaysFromNow);
    endOfDay.setHours(23, 59, 59, 999);

    console.log(`Looking for trials ending between ${startOfDay.toISOString()} and ${endOfDay.toISOString()}`);

    // Find all subscriptions that are trialing and expire in 14 days
    // and haven't been sent a warning yet
    const { data: expiringSubscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select('user_id, trial_end, trial_warning_sent')
      .eq('status', 'trialing')
      .gte('trial_end', startOfDay.toISOString())
      .lte('trial_end', endOfDay.toISOString())
      .is('trial_warning_sent', false);

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiringSubscriptions?.length || 0} subscriptions expiring in 14 days`);

    if (!expiringSubscriptions || expiringSubscriptions.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No trials expiring in 14 days',
          count: 0,
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let successCount = 0;
    let failCount = 0;

    // Send warning email to each user
    for (const subscription of expiringSubscriptions) {
      try {
        // Get user's email
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
          subscription.user_id
        );

        if (userError || !userData?.user?.email) {
          console.error(`Failed to get user ${subscription.user_id}:`, userError);
          failCount++;
          continue;
        }

        const userEmail = userData.user.email;
        const trialEndDate = new Date(subscription.trial_end);
        
        console.log(`Sending trial warning to ${userEmail}`);

        // Send notification via the send-notification function
        const { error: notifError } = await supabase.functions.invoke('send-notification', {
          body: {
            userId: subscription.user_id,
            type: 'email',
            subject: '⏰ Your PocketTeller trial ends in 14 days',
            message: `Hi there,\n\nYour 30-day free trial of PocketTeller Pro is ending soon!\n\n📅 Trial expires on: ${trialEndDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}\n\n🎁 Special Offer: Upgrade now and get 6 months for just $15 (limited time offer!)\n\nWhat you'll keep with Pro:\n• Unlimited AI financial coaching\n• Automatic bank connections & syncing\n• Smart transaction categorization\n• Advanced insights & analytics\n• Budget tracking & goal management\n\nUpgrade now: https://pocketbanker.app/subscription\n\nDon't lose your progress – upgrade today!\n\nBest regards,\nThe PocketTeller Team`,
            metadata: {
              trialEndDate: subscription.trial_end,
              daysRemaining: 14,
              reason: 'trial_expiring_soon',
            },
          },
        });

        if (notifError) {
          console.error(`Failed to send notification to ${userEmail}:`, notifError);
          failCount++;
          continue;
        }

        // Mark warning as sent
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            trial_warning_sent: true,
            trial_warning_sent_at: new Date().toISOString(),
          })
          .eq('user_id', subscription.user_id);

        if (updateError) {
          console.error(`Failed to update subscription for ${subscription.user_id}:`, updateError);
          failCount++;
          continue;
        }

        successCount++;
        console.log(`✅ Successfully sent warning to ${userEmail}`);

      } catch (error) {
        console.error(`Error processing user ${subscription.user_id}:`, error);
        failCount++;
      }
    }

    console.log(`✅ Trial warnings sent: ${successCount} success, ${failCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${expiringSubscriptions.length} expiring trials`,
        successCount,
        failCount,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in trial expiration checker:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Failed to process trial expirations',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

