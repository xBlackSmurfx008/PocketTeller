import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SpendingData {
  totalSpent: number;
  categoryBreakdown: { [key: string]: number };
  transactionCount: number;
  avgTransactionAmount: number;
  topCategories: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { scheduleType } = await req.json();
    console.log(`Running ${scheduleType} notification scheduler`);

    // Get all users with notification preferences
    const { data: users } = await supabase
      .from("notification_preferences")
      .select(`
        user_id,
        email_enabled,
        in_app_enabled,
        daily_spending_recap,
        weekly_spending_recap,
        monthly_spending_recap,
        transaction_sync_reminder,
        bill_reminders,
        goal_progress_updates,
        inactivity_reminders,
        timezone,
        preferred_time_daily,
        preferred_day_weekly,
        preferred_day_monthly,
        last_inactivity_reminder
      `);

    if (!users || users.length === 0) {
      console.log("No users found with notification preferences");
      return new Response(
        JSON.stringify({ success: true, message: "No users to notify" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let processedCount = 0;

    for (const user of users) {
      try {
        await processUserNotifications(supabase, user, scheduleType);
        processedCount++;
      } catch (error) {
        console.error(`Error processing notifications for user ${user.user_id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed notifications for ${processedCount} users`,
        scheduleType 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in notification-scheduler:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

async function processUserNotifications(supabase: any, user: any, scheduleType: string) {
  const { user_id } = user;

  switch (scheduleType) {
    case "daily":
      await processDailyNotifications(supabase, user);
      break;
    case "weekly":
      await processWeeklyNotifications(supabase, user);
      break;
    case "monthly":
      await processMonthlyNotifications(supabase, user);
      break;
    case "transaction_sync":
      await processTransactionSyncReminders(supabase, user);
      break;
    case "bill_reminders":
      await processBillReminders(supabase, user);
      break;
    case "goal_progress":
      await processGoalProgressUpdates(supabase, user);
      break;
    case "inactivity":
      await processInactivityReminders(supabase, user);
      break;
  }
}

async function processDailyNotifications(supabase: any, user: any) {
  if (!user.daily_spending_recap) return;

  // Get today's spending data
  const today = new Date().toISOString().split('T')[0];
  const spendingData = await getDaySpendingData(supabase, user.user_id, today);

  if (spendingData.totalSpent === 0) {
    console.log(`No spending data for user ${user.user_id} today`);
    return;
  }

  const title = "Your Daily Spending Recap";
  const content = generateDailyRecapContent(spendingData);

  await sendNotification(supabase, {
    userId: user.user_id,
    notificationType: "daily_spending_recap",
    title,
    content,
    channels: getEnabledChannels(user),
    contextData: spendingData,
    actionUrl: "/transactions",
    actionText: "View Transactions"
  });
}

async function processWeeklyNotifications(supabase: any, user: any) {
  if (!user.weekly_spending_recap) return;

  // Get this week's spending data
  const weekStart = getWeekStart();
  const weekEnd = new Date().toISOString().split('T')[0];
  const spendingData = await getDateRangeSpendingData(supabase, user.user_id, weekStart, weekEnd);

  const title = "Your Weekly Spending Summary";
  const content = generateWeeklyRecapContent(spendingData);

  await sendNotification(supabase, {
    userId: user.user_id,
    notificationType: "weekly_spending_recap",
    title,
    content,
    channels: getEnabledChannels(user),
    contextData: spendingData,
    actionUrl: "/budget",
    actionText: "View Budget"
  });
}

async function processMonthlyNotifications(supabase: any, user: any) {
  if (!user.monthly_spending_recap) return;

  // Get this month's spending data
  const monthStart = getMonthStart();
  const monthEnd = new Date().toISOString().split('T')[0];
  const spendingData = await getDateRangeSpendingData(supabase, user.user_id, monthStart, monthEnd);

  const title = "Your Monthly Spending Report";
  const content = generateMonthlyRecapContent(spendingData);

  await sendNotification(supabase, {
    userId: user.user_id,
    notificationType: "monthly_spending_recap",
    title,
    content,
    channels: getEnabledChannels(user),
    contextData: spendingData,
    actionUrl: "/budget",
    actionText: "View Budget"
  });
}

async function processTransactionSyncReminders(supabase: any, user: any) {
  if (!user.transaction_sync_reminder) return;

  // Check last transaction sync time
  const { data: lastTransaction } = await supabase
    .from("transactions")
    .select("created_at")
    .eq("user_id", user.user_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!lastTransaction) return;

  const lastSync = new Date(lastTransaction.created_at);
  const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);

  // Remind if no sync in 24+ hours
  if (hoursSinceSync >= 24) {
    await sendNotification(supabase, {
      userId: user.user_id,
      notificationType: "transaction_sync_reminder",
      title: "Time to Sync Your Transactions",
      content: `It's been ${Math.floor(hoursSinceSync)} hours since your last transaction sync. Keep your budget up to date!`,
      channels: getEnabledChannels(user),
      actionUrl: "/transactions",
      actionText: "Sync Now"
    });
  }
}

async function processBillReminders(supabase: any, user: any) {
  if (!user.bill_reminders) return;

  // Get upcoming bills (next 3 days)
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const { data: upcomingBills } = await supabase
    .from("bills")
    .select("*")
    .eq("user_id", user.user_id)
    .eq("is_paid", false)
    .lte("due_date", threeDaysFromNow.toISOString().split('T')[0]);

  if (upcomingBills && upcomingBills.length > 0) {
    const totalAmount = upcomingBills.reduce((sum, bill) => sum + Number(bill.amount), 0);
    
    await sendNotification(supabase, {
      userId: user.user_id,
      notificationType: "bill_reminder",
      title: `${upcomingBills.length} Bills Due Soon`,
      content: `You have ${upcomingBills.length} bills totaling $${totalAmount.toFixed(2)} due in the next 3 days.`,
      channels: getEnabledChannels(user),
      contextData: { bills: upcomingBills },
      actionUrl: "/budget",
      actionText: "View Bills"
    });
  }
}

async function processGoalProgressUpdates(supabase: any, user: any) {
  if (!user.goal_progress_updates) return;

  const { data: goals } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", user.user_id);

  if (!goals || goals.length === 0) return;

  for (const goal of goals) {
    const progress = (goal.current_amount / goal.target_amount) * 100;
    
    // Notify on significant milestones
    if (progress >= 25 && progress < 30) {
      await sendNotification(supabase, {
        userId: user.user_id,
        notificationType: "goal_progress",
        title: `${goal.goal_name} - 25% Complete!`,
        content: `Great progress! You're ${progress.toFixed(1)}% of the way to your ${goal.goal_name} goal.`,
        channels: getEnabledChannels(user),
        contextData: { goal, progress },
        actionUrl: "/goals",
        actionText: "View Goals"
      });
    }
  }
}

async function processInactivityReminders(supabase: any, user: any) {
  if (!user.inactivity_reminders) return;

  // Check if user has been inactive for 7+ days
  const lastReminder = user.last_inactivity_reminder ? new Date(user.last_inactivity_reminder) : null;
  const daysSinceReminder = lastReminder ? (Date.now() - lastReminder.getTime()) / (1000 * 60 * 60 * 24) : 999;

  if (daysSinceReminder >= 7) {
    await sendNotification(supabase, {
      userId: user.user_id,
      notificationType: "inactivity_reminder",
      title: "We Miss You!",
      content: "It's been a while since you checked your budget. See how you're doing this week!",
      channels: getEnabledChannels(user),
      actionUrl: "/",
      actionText: "View Dashboard"
    });

    // Update last reminder time
    await supabase
      .from("notification_preferences")
      .update({ last_inactivity_reminder: new Date().toISOString() })
      .eq("user_id", user.user_id);
  }
}

// Helper functions
async function getDaySpendingData(supabase: any, userId: string, date: string): Promise<SpendingData> {
  const { data: transactions } = await supabase
    .from("transactions")
    .select("amount, category")
    .eq("user_id", userId)
    .eq("date", date)
    .gt("amount", 0); // Only expenses

  if (!transactions || transactions.length === 0) {
    return { totalSpent: 0, categoryBreakdown: {}, transactionCount: 0, avgTransactionAmount: 0, topCategories: [] };
  }

  const totalSpent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const categoryBreakdown = transactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
    return acc;
  }, {});
  
  const topCategories = Object.entries(categoryBreakdown)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([category]) => category);

  return {
    totalSpent,
    categoryBreakdown,
    transactionCount: transactions.length,
    avgTransactionAmount: totalSpent / transactions.length,
    topCategories
  };
}

async function getDateRangeSpendingData(supabase: any, userId: string, startDate: string, endDate: string): Promise<SpendingData> {
  const { data: transactions } = await supabase
    .from("transactions")
    .select("amount, category")
    .eq("user_id", userId)
    .gte("date", startDate)
    .lte("date", endDate)
    .gt("amount", 0);

  if (!transactions || transactions.length === 0) {
    return { totalSpent: 0, categoryBreakdown: {}, transactionCount: 0, avgTransactionAmount: 0, topCategories: [] };
  }

  const totalSpent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
  const categoryBreakdown = transactions.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
    return acc;
  }, {});
  
  const topCategories = Object.entries(categoryBreakdown)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([category]) => category);

  return {
    totalSpent,
    categoryBreakdown,
    transactionCount: transactions.length,
    avgTransactionAmount: totalSpent / transactions.length,
    topCategories
  };
}

function generateDailyRecapContent(data: SpendingData): string {
  const topCategory = data.topCategories[0];
  const topAmount = data.categoryBreakdown[topCategory];
  
  return `Today you spent $${data.totalSpent.toFixed(2)} across ${data.transactionCount} transactions. Your biggest expense was $${topAmount?.toFixed(2)} on ${topCategory}.`;
}

function generateWeeklyRecapContent(data: SpendingData): string {
  return `This week you spent $${data.totalSpent.toFixed(2)} across ${data.transactionCount} transactions. Top categories: ${data.topCategories.slice(0, 3).join(', ')}.`;
}

function generateMonthlyRecapContent(data: SpendingData): string {
  return `This month you spent $${data.totalSpent.toFixed(2)} across ${data.transactionCount} transactions. Your average transaction was $${data.avgTransactionAmount.toFixed(2)}. Top spending categories: ${data.topCategories.join(', ')}.`;
}

function getEnabledChannels(user: any): string[] {
  const channels = [];
  if (user.in_app_enabled) channels.push("in_app");
  if (user.email_enabled) channels.push("email");
  return channels;
}

function getWeekStart(): string {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday
  const diff = now.getDate() - dayOfWeek;
  const weekStart = new Date(now.setDate(diff));
  return weekStart.toISOString().split('T')[0];
}

function getMonthStart(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
}

async function sendNotification(supabase: any, notification: any) {
  // Call the send-notification function
  const { error } = await supabase.functions.invoke("send-notification", {
    body: notification
  });
  
  if (error) {
    console.error("Error sending notification:", error);
  }
}

serve(handler);