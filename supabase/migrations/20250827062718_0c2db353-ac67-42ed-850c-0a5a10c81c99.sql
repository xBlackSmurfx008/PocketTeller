-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  
  -- Channel preferences
  email_enabled boolean NOT NULL DEFAULT true,
  push_enabled boolean NOT NULL DEFAULT true,
  sms_enabled boolean NOT NULL DEFAULT false,
  in_app_enabled boolean NOT NULL DEFAULT true,
  
  -- Notification type preferences
  transaction_sync_reminder boolean NOT NULL DEFAULT true,
  daily_spending_recap boolean NOT NULL DEFAULT true,
  weekly_spending_recap boolean NOT NULL DEFAULT true,
  monthly_spending_recap boolean NOT NULL DEFAULT true,
  bill_reminders boolean NOT NULL DEFAULT true,
  goal_progress_updates boolean NOT NULL DEFAULT true,
  budget_alerts boolean NOT NULL DEFAULT true,
  inactivity_reminders boolean NOT NULL DEFAULT true,
  security_alerts boolean NOT NULL DEFAULT true,
  
  -- Timing preferences
  quiet_hours_start time DEFAULT '22:00:00',
  quiet_hours_end time DEFAULT '08:00:00',
  timezone text DEFAULT 'UTC',
  preferred_time_daily time DEFAULT '19:00:00',
  preferred_day_weekly integer DEFAULT 0, -- 0 = Sunday
  preferred_day_monthly integer DEFAULT -1, -- -1 = last day of month
  
  -- Frequency controls
  max_daily_notifications integer DEFAULT 5,
  last_inactivity_reminder timestamp with time zone,
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create notification logs table
CREATE TABLE public.notification_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  notification_type text NOT NULL,
  channel text NOT NULL, -- 'email', 'push', 'sms', 'in_app'
  title text NOT NULL,
  content text NOT NULL,
  
  -- Delivery tracking
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  delivered_at timestamp with time zone,
  opened_at timestamp with time zone,
  clicked_at timestamp with time zone,
  
  -- Context data
  context_data jsonb DEFAULT '{}',
  template_id text,
  
  -- Status
  status text NOT NULL DEFAULT 'sent', -- 'sent', 'delivered', 'failed', 'opened', 'clicked'
  error_message text,
  
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create in-app notifications table
CREATE TABLE public.in_app_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  notification_type text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  
  -- Display data
  icon text DEFAULT 'bell',
  action_url text,
  action_text text,
  
  -- Status
  is_read boolean NOT NULL DEFAULT false,
  is_archived boolean NOT NULL DEFAULT false,
  
  -- Priority and grouping
  priority integer NOT NULL DEFAULT 3, -- 1 = high, 3 = normal, 5 = low
  group_key text, -- For grouping similar notifications
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  read_at timestamp with time zone,
  archived_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.in_app_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_preferences
CREATE POLICY "Users can view their own notification preferences"
  ON public.notification_preferences
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own notification preferences"
  ON public.notification_preferences
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own notification preferences"
  ON public.notification_preferences
  FOR UPDATE
  USING (user_id = auth.uid());

-- RLS Policies for notification_logs
CREATE POLICY "Users can view their own notification logs"
  ON public.notification_logs
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Service role can insert notification logs"
  ON public.notification_logs
  FOR INSERT
  WITH CHECK (
    current_setting('role', true) = 'service_role' OR
    user_id = auth.uid()
  );

-- RLS Policies for in_app_notifications
CREATE POLICY "Users can view their own in-app notifications"
  ON public.in_app_notifications
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own in-app notifications"
  ON public.in_app_notifications
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Service role can insert in-app notifications"
  ON public.in_app_notifications
  FOR INSERT
  WITH CHECK (
    current_setting('role', true) = 'service_role' OR
    user_id = auth.uid()
  );

-- Create indexes for better performance
CREATE INDEX idx_notification_preferences_user_id ON public.notification_preferences(user_id);
CREATE INDEX idx_notification_logs_user_id ON public.notification_logs(user_id);
CREATE INDEX idx_notification_logs_sent_at ON public.notification_logs(sent_at);
CREATE INDEX idx_notification_logs_type ON public.notification_logs(notification_type);
CREATE INDEX idx_in_app_notifications_user_id ON public.in_app_notifications(user_id);
CREATE INDEX idx_in_app_notifications_unread ON public.in_app_notifications(user_id, is_read, created_at);

-- Create function to create default notification preferences for new users
CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.notification_preferences (user_id, timezone)
  VALUES (
    NEW.user_id,
    COALESCE(NEW.timezone, 'UTC')
  );
  RETURN NEW;
END;
$function$;

-- Create trigger to automatically create notification preferences for new users
CREATE TRIGGER create_notification_preferences_for_new_user
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_notification_preferences();

-- Create function to update updated_at column
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();