import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  userId: string;
  notificationType: string;
  title: string;
  content: string;
  channels?: string[];
  contextData?: any;
  priority?: number;
  actionUrl?: string;
  actionText?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    const {
      userId,
      notificationType,
      title,
      content,
      channels = ["in_app"],
      contextData = {},
      priority = 3,
      actionUrl,
      actionText,
    }: NotificationRequest = await req.json();

    console.log(`Sending notification to user ${userId}:`, { notificationType, title, channels });

    // Get user preferences
    const { data: preferences } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!preferences) {
      console.log("No notification preferences found for user, using defaults");
    }

    // Get user profile for email and timezone
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    const { data: userAuth } = await supabase.auth.admin.getUserById(userId);
    const userEmail = userAuth?.user?.email;

    // Check if we should send notification based on preferences
    const shouldSend = (channel: string): boolean => {
      if (!preferences) return true; // Default to sending if no preferences

      // Check channel preference
      switch (channel) {
        case "email":
          return preferences.email_enabled;
        case "push":
          return preferences.push_enabled;
        case "sms":
          return preferences.sms_enabled;
        case "in_app":
          return preferences.in_app_enabled;
        default:
          return true;
      }
    };

    // Check notification type preference
    const typeAllowed = (): boolean => {
      if (!preferences) return true;

      switch (notificationType) {
        case "transaction_sync_reminder":
          return preferences.transaction_sync_reminder;
        case "daily_spending_recap":
          return preferences.daily_spending_recap;
        case "weekly_spending_recap":
          return preferences.weekly_spending_recap;
        case "monthly_spending_recap":
          return preferences.monthly_spending_recap;
        case "bill_reminder":
          return preferences.bill_reminders;
        case "goal_progress":
          return preferences.goal_progress_updates;
        case "budget_alert":
          return preferences.budget_alerts;
        case "inactivity_reminder":
          return preferences.inactivity_reminders;
        case "security_alert":
          return preferences.security_alerts;
        default:
          return true;
      }
    };

    if (!typeAllowed()) {
      console.log(`Notification type ${notificationType} disabled for user ${userId}`);
      return new Response(
        JSON.stringify({ success: true, message: "Notification disabled by user preferences" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check quiet hours (simplified - should consider timezone)
    const now = new Date();
    const currentHour = now.getUTCHours();
    
    if (preferences?.quiet_hours_start && preferences?.quiet_hours_end) {
      const quietStart = parseInt(preferences.quiet_hours_start.split(':')[0]);
      const quietEnd = parseInt(preferences.quiet_hours_end.split(':')[0]);
      
      if ((quietStart > quietEnd && (currentHour >= quietStart || currentHour < quietEnd)) ||
          (quietStart < quietEnd && currentHour >= quietStart && currentHour < quietEnd)) {
        console.log(`Skipping notification due to quiet hours for user ${userId}`);
        return new Response(
          JSON.stringify({ success: true, message: "Notification postponed due to quiet hours" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    const results: any[] = [];

    // Send in-app notification
    if (channels.includes("in_app") && shouldSend("in_app")) {
      try {
        const { error: inAppError } = await supabase
          .from("in_app_notifications")
          .insert({
            user_id: userId,
            notification_type: notificationType,
            title,
            content,
            priority,
            action_url: actionUrl,
            action_text: actionText,
          });

        if (inAppError) {
          console.error("Error creating in-app notification:", inAppError);
        } else {
          results.push({ channel: "in_app", status: "sent" });
          
          // Log the notification
          await supabase.from("notification_logs").insert({
            user_id: userId,
            notification_type: notificationType,
            channel: "in_app",
            title,
            content,
            context_data: contextData,
            status: "sent",
          });
        }
      } catch (error) {
        console.error("Failed to send in-app notification:", error);
        results.push({ channel: "in_app", status: "failed", error: error.message });
      }
    }

    // Send email notification
    if (channels.includes("email") && shouldSend("email") && userEmail && resend) {
      try {
        const emailResponse = await resend.emails.send({
          from: "Budget AI <notifications@yourdomain.com>", // Replace with your domain
          to: [userEmail],
          subject: title,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">${title}</h2>
              <p style="color: #666; line-height: 1.6;">${content}</p>
              ${actionUrl ? `<a href="${actionUrl}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 16px;">${actionText || 'View Details'}</a>` : ''}
              <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px;">
                To manage your notification preferences, <a href="${supabaseUrl}/account">visit your account settings</a>.
              </p>
            </div>
          `,
        });

        results.push({ channel: "email", status: "sent", id: emailResponse.data?.id });
        
        // Log the notification
        await supabase.from("notification_logs").insert({
          user_id: userId,
          notification_type: notificationType,
          channel: "email",
          title,
          content,
          context_data: { ...contextData, email_id: emailResponse.data?.id },
          status: "sent",
        });

        console.log("Email sent successfully:", emailResponse.data?.id);
      } catch (error) {
        console.error("Failed to send email notification:", error);
        results.push({ channel: "email", status: "failed", error: error.message });
        
        // Log the failed notification
        await supabase.from("notification_logs").insert({
          user_id: userId,
          notification_type: notificationType,
          channel: "email",
          title,
          content,
          context_data: contextData,
          status: "failed",
          error_message: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);