import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  in_app_enabled: boolean;
  transaction_sync_reminder: boolean;
  daily_spending_recap: boolean;
  weekly_spending_recap: boolean;
  monthly_spending_recap: boolean;
  bill_reminders: boolean;
  goal_progress_updates: boolean;
  budget_alerts: boolean;
  inactivity_reminders: boolean;
  security_alerts: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
  preferred_time_daily: string;
  preferred_day_weekly: number;
  preferred_day_monthly: number;
  max_daily_notifications: number;
  created_at: string;
  updated_at: string;
}

export function useNotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No preferences found, create default ones
          const { data: newPrefs, error: createError } = await supabase
            .from("notification_preferences")
            .insert({
              user_id: user.id,
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            })
            .select()
            .single();

          if (createError) {
            throw createError;
          }
          setPreferences(newPrefs);
        } else {
          throw error;
        }
      } else {
        setPreferences(data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!user || !preferences) return;

    try {
      const { data, error } = await supabase
        .from("notification_preferences")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      setPreferences(data);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, [user]);

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    refetch: fetchPreferences,
  };
}