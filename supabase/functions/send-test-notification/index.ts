import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Verify the user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Invalid authorization");
    }

    const { notificationType } = await req.json();

    let title: string;
    let content: string;
    let priority = 3;
    let actionUrl: string | undefined;
    let actionText: string | undefined;

    // Generate test notification content based on type
    switch (notificationType) {
      case "daily_spending_recap":
        title = "Your Daily Spending Recap";
        content = "Today you spent $45.67 across 8 transactions. Your biggest expense was $18.50 on Food & Dining.";
        actionUrl = "/transactions";
        actionText = "View Transactions";
        break;
      
      case "bill_reminder":
        title = "Bill Due Soon!";
        content = "Your Netflix subscription ($15.99) is due in 2 days.";
        priority = 2;
        actionUrl = "/budget";
        actionText = "View Bills";
        break;
      
      case "goal_progress":
        title = "Vacation Fund - 75% Complete!";
        content = "Great progress! You're $750 away from your $3,000 vacation goal. Keep it up!";
        actionUrl = "/goals";
        actionText = "View Goals";
        break;
      
      case "budget_alert":
        title = "Budget Alert: Food & Dining";
        content = "You've spent 90% of your monthly Food & Dining budget ($450 of $500). Consider tracking your remaining spending.";
        priority = 2;
        actionUrl = "/budget";
        actionText = "View Budget";
        break;
      
      case "transaction_sync_reminder":
        title = "Time to Sync Your Transactions";
        content = "It's been 2 days since your last transaction sync. Keep your budget up to date!";
        actionUrl = "/transactions";
        actionText = "Sync Now";
        break;
      
      case "security_alert":
        title = "Security Alert";
        content = "Your account was accessed from a new device. If this wasn't you, please review your account security.";
        priority = 1;
        actionUrl = "/account";
        actionText = "Review Security";
        break;
      
      default:
        title = "Welcome to Budget AI!";
        content = "Your intelligent financial assistant is ready to help you manage your money better.";
        actionUrl = "/chat";
        actionText = "Start Chatting";
    }

    // Send the notification using the send-notification function
    const { error: notificationError } = await supabase.functions.invoke("send-notification", {
      body: {
        userId: user.id,
        notificationType,
        title,
        content,
        channels: ["in_app"],
        priority,
        actionUrl,
        actionText,
        contextData: {
          test: true,
          generatedAt: new Date().toISOString(),
        },
      },
    });

    if (notificationError) {
      throw notificationError;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Test notification sent successfully",
        notification: { title, content, type: notificationType }
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  } catch (error: any) {
    console.error("Error in send-test-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
};

serve(handler);