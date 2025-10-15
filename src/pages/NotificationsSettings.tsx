import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, Bell } from 'lucide-react';
import NotificationSettings from '@/components/NotificationSettings';
import NotificationInbox from '@/components/NotificationInbox';

export default function NotificationsSettings() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto pt-perfect px-4 pb-4 space-y-6 content-container">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/settings')}
            className="p-2"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6" />
              Notifications
            </h1>
            <p className="text-muted-foreground">Manage your notification preferences</p>
          </div>
        </div>

        {/* Notification Settings */}
        <NotificationSettings />

        {/* Notification Inbox */}
        <NotificationInbox />
      </main>
    </div>
  );
}
