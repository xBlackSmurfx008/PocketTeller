import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { useToast } from "@/hooks/use-toast";
import { Bell, Mail, Smartphone, Clock, Calendar, Shield, TrendingUp, CreditCard, Target, AlertTriangle } from "lucide-react";

const NotificationSettings = () => {
  const { preferences, loading, updatePreferences } = useNotificationPreferences();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>Loading your notification preferences...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!preferences) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>Unable to load notification preferences.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleUpdate = async (updates: any) => {
    try {
      setSaving(true);
      await updatePreferences(updates);
      toast({
        title: "Settings Updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update notification settings.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const notificationTypes = [
    {
      key: "transaction_sync_reminder",
      label: "Transaction Sync Reminders",
      description: "Get reminded to sync your latest transactions",
      icon: <CreditCard className="h-4 w-4" />,
    },
    {
      key: "daily_spending_recap",
      label: "Daily Spending Recap",
      description: "Summary of your daily expenses",
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      key: "weekly_spending_recap",
      label: "Weekly Spending Recap",
      description: "Weekly overview of your spending patterns",
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      key: "monthly_spending_recap",
      label: "Monthly Spending Report",
      description: "Comprehensive monthly financial summary",
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      key: "bill_reminders",
      label: "Bill Reminders",
      description: "Alerts for upcoming bill due dates",
      icon: <AlertTriangle className="h-4 w-4" />,
    },
    {
      key: "goal_progress_updates",
      label: "Goal Progress Updates",
      description: "Updates on your financial goal achievements",
      icon: <Target className="h-4 w-4" />,
    },
    {
      key: "budget_alerts",
      label: "Budget Alerts",
      description: "Notifications when you exceed budget limits",
      icon: <AlertTriangle className="h-4 w-4" />,
    },
    {
      key: "inactivity_reminders",
      label: "Inactivity Reminders",
      description: "Gentle nudges to stay engaged with your finances",
      icon: <Bell className="h-4 w-4" />,
    },
    {
      key: "security_alerts",
      label: "Security Alerts",
      description: "Important security and account notifications",
      icon: <Shield className="h-4 w-4" />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Channel Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Channels
          </CardTitle>
          <CardDescription>
            Choose how you want to receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label>In-App Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Notifications within the application
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.in_app_enabled}
              onCheckedChange={(checked) =>
                handleUpdate({ in_app_enabled: checked })
              }
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Email alerts and summaries
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.email_enabled}
              onCheckedChange={(checked) =>
                handleUpdate({ email_enabled: checked })
              }
              disabled={saving}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <div>
                <Label>Push Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Mobile and browser push notifications
                </p>
              </div>
              <Badge variant="secondary">Coming Soon</Badge>
            </div>
            <Switch
              checked={preferences.push_enabled}
              onCheckedChange={(checked) =>
                handleUpdate({ push_enabled: checked })
              }
              disabled={true}
            />
          </div>
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Types</CardTitle>
          <CardDescription>
            Choose which types of notifications you want to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationTypes.map((type, index) => (
            <div key={type.key}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {type.icon}
                  <div>
                    <Label>{type.label}</Label>
                    <p className="text-sm text-muted-foreground">
                      {type.description}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={preferences[type.key as keyof typeof preferences] as boolean}
                  onCheckedChange={(checked) =>
                    handleUpdate({ [type.key]: checked })
                  }
                  disabled={saving}
                />
              </div>
              {index < notificationTypes.length - 1 && <Separator className="mt-4" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Timing Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Timing Preferences
          </CardTitle>
          <CardDescription>
            Customize when you receive notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={preferences.timezone}
                onChange={(e) => handleUpdate({ timezone: e.target.value })}
                placeholder="UTC"
                disabled={saving}
              />
            </div>

            <div>
              <Label htmlFor="daily-time">Preferred Daily Notification Time</Label>
              <Input
                id="daily-time"
                type="time"
                value={preferences.preferred_time_daily}
                onChange={(e) =>
                  handleUpdate({ preferred_time_daily: e.target.value })
                }
                disabled={saving}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quiet-start">Quiet Hours Start</Label>
              <Input
                id="quiet-start"
                type="time"
                value={preferences.quiet_hours_start}
                onChange={(e) =>
                  handleUpdate({ quiet_hours_start: e.target.value })
                }
                disabled={saving}
              />
            </div>

            <div>
              <Label htmlFor="quiet-end">Quiet Hours End</Label>
              <Input
                id="quiet-end"
                type="time"
                value={preferences.quiet_hours_end}
                onChange={(e) =>
                  handleUpdate({ quiet_hours_end: e.target.value })
                }
                disabled={saving}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="max-daily">Maximum Daily Notifications</Label>
            <Select
              value={preferences.max_daily_notifications.toString()}
              onValueChange={(value) =>
                handleUpdate({ max_daily_notifications: parseInt(value) })
              }
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 notification</SelectItem>
                <SelectItem value="3">3 notifications</SelectItem>
                <SelectItem value="5">5 notifications</SelectItem>
                <SelectItem value="10">10 notifications</SelectItem>
                <SelectItem value="999">No limit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSettings;