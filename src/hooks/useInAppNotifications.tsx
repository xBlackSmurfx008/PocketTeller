import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface InAppNotification {
  id: string;
  user_id: string;
  notification_type: string;
  title: string;
  content: string;
  icon: string;
  action_url?: string;
  action_text?: string;
  is_read: boolean;
  is_archived: boolean;
  priority: number;
  group_key?: string;
  created_at: string;
  read_at?: string;
  archived_at?: string;
}

export function useInAppNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("in_app_notifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_archived", false)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("in_app_notifications")
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq("id", notificationId)
        .eq("user_id", user?.id);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId
            ? { ...notif, is_read: true, read_at: new Date().toISOString() }
            : notif
        )
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const unreadIds = notifications
        .filter(n => !n.is_read)
        .map(n => n.id);

      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from("in_app_notifications")
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .in("id", unreadIds)
        .eq("user_id", user.id);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notif => ({ 
          ...notif, 
          is_read: true, 
          read_at: new Date().toISOString() 
        }))
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  const archiveNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("in_app_notifications")
        .update({ 
          is_archived: true, 
          archived_at: new Date().toISOString() 
        })
        .eq("id", notificationId)
        .eq("user_id", user?.id);

      if (error) throw error;

      setNotifications(prev =>
        prev.filter(notif => notif.id !== notificationId)
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Get unread count
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Set up real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("notification_changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "in_app_notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications(prev => [payload.new as InAppNotification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [user]);

  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    refetch: fetchNotifications,
  };
}