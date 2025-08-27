import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useInAppNotifications } from "@/hooks/useInAppNotifications";
import { formatDistanceToNow } from "date-fns";
import { 
  Bell, 
  BellOff, 
  CheckCheck, 
  Archive, 
  ExternalLink,
  CreditCard,
  TrendingUp,
  Calendar,
  Target,
  AlertTriangle,
  Shield
} from "lucide-react";

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "transaction_sync_reminder":
      return <CreditCard className="h-4 w-4" />;
    case "daily_spending_recap":
    case "weekly_spending_recap":
    case "monthly_spending_recap":
      return <TrendingUp className="h-4 w-4" />;
    case "bill_reminder":
      return <Calendar className="h-4 w-4" />;
    case "goal_progress":
      return <Target className="h-4 w-4" />;
    case "budget_alert":
      return <AlertTriangle className="h-4 w-4" />;
    case "security_alert":
      return <Shield className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
};

const getPriorityColor = (priority: number) => {
  if (priority <= 2) return "destructive"; // High priority
  if (priority === 3) return "default"; // Normal priority
  return "secondary"; // Low priority
};

const getPriorityText = (priority: number) => {
  if (priority <= 2) return "High";
  if (priority === 3) return "Normal";
  return "Low";
};

const NotificationInbox = () => {
  const {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    archiveNotification,
  } = useInAppNotifications();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading notifications...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {unreadCount > 0 ? (
              <Bell className="h-5 w-5 text-primary" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="flex items-center gap-2"
            >
              <CheckCheck className="h-4 w-4" />
              Mark All Read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <BellOff className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No notifications yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              You'll see important updates and alerts here
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={`p-4 rounded-lg border transition-colors ${
                      notification.is_read
                        ? "bg-background"
                        : "bg-muted/50 border-primary/20"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.notification_type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm">
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={getPriorityColor(notification.priority)}
                              className="text-xs"
                            >
                              {getPriorityText(notification.priority)}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">
                          {notification.content}
                        </p>
                        
                        <div className="flex items-center gap-2">
                          {notification.action_url && notification.action_text && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                window.open(notification.action_url, "_self");
                                if (!notification.is_read) {
                                  markAsRead(notification.id);
                                }
                              }}
                              className="flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {notification.action_text}
                            </Button>
                          )}
                          
                          {!notification.is_read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="flex items-center gap-1"
                            >
                              <CheckCheck className="h-3 w-3" />
                              Mark Read
                            </Button>
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => archiveNotification(notification.id)}
                            className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                          >
                            <Archive className="h-3 w-3" />
                            Archive
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {index < notifications.length - 1 && (
                    <Separator className="my-4" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationInbox;