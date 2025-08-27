import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff } from "lucide-react";
import { useInAppNotifications } from "@/hooks/useInAppNotifications";
import { useNavigate } from "react-router-dom";

const NotificationBell = () => {
  const { unreadCount } = useInAppNotifications();
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/account");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className="relative hover:bg-accent/80"
      aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
    >
      {unreadCount > 0 ? (
        <Bell className="h-5 w-5 text-primary" />
      ) : (
        <BellOff className="h-5 w-5 text-muted-foreground" />
      )}
      
      {unreadCount > 0 && (
        <Badge
          variant="destructive"
          className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </Badge>
      )}
    </Button>
  );
};

export default NotificationBell;