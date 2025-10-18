import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Shield, 
  Bell, 
  Palette, 
  Building2, 
  CreditCard,
  Database,
  LogOut,
  ChevronRight,
  Settings as SettingsIcon
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSignOutAction } from '@/hooks/useSignOutAction';
import { useConnectedAccounts } from '@/hooks/useConnectedAccounts';
import { useSubscription } from '@/hooks/useSubscription';

export default function Settings() {
  const { user } = useAuth();
  const { handleSignOut } = useSignOutAction();
  const { connectedBanks, limitInfo } = useConnectedAccounts();
  const navigate = useNavigate();
  const { createCheckoutSession, loading } = useSubscription();

  const handleCheckout6Month = async () => {
    const session = await createCheckoutSession('6month');
    if (session?.url) {
      window.location.href = session.url;
    }
  };

  const settingsSections = [
    {
      id: 'profile',
      title: 'Profile Information',
      description: 'Manage your account details and preferences',
      icon: User,
      path: '/settings/profile',
      color: 'text-blue-600'
    },
    {
      id: 'banking',
      title: 'Bank Connections',
      description: `${connectedBanks.length} of ${limitInfo.maxConnections} banks connected`,
      icon: Building2,
      path: '/settings/banking',
      color: 'text-green-600',
      badge: connectedBanks.length
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Manage your notification preferences',
      icon: Bell,
      path: '/settings/notifications',
      color: 'text-orange-600'
    },
    {
      id: 'appearance',
      title: 'Appearance',
      description: 'Customize theme, layout, and display options',
      icon: Palette,
      path: '/settings/appearance',
      color: 'text-purple-600'
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      description: 'Manage security settings and data privacy',
      icon: Shield,
      path: '/settings/security',
      color: 'text-red-600'
    },
    {
      id: 'data',
      title: 'Data Management',
      description: 'Export, backup, or delete your data',
      icon: Database,
      path: '/settings/data',
      color: 'text-gray-600'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto pt-perfect px-4 pb-4 space-y-6 content-container">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/home')}
            className="p-2"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <SettingsIcon className="h-6 w-6" />
              Settings
            </h1>
            <p className="text-muted-foreground">Manage your account and preferences</p>
          </div>
        </div>

        {/* Settings Sections */}
        <div className="grid gap-4">
          {settingsSections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Card 
                key={section.id} 
                className="cursor-pointer hover:shadow-md transition-all duration-200 card-hover-lift state-layer touch-target"
                onClick={() => navigate(section.path)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg bg-muted/50 ${section.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{section.title}</h3>
                          {section.badge !== undefined && (
                            <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                              {section.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{section.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common settings and actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              className="w-full justify-start gap-3"
              onClick={handleCheckout6Month}
              disabled={loading}
            >
              <CreditCard className="h-4 w-4" />
              Start 6‑Month Checkout ($14.99)
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
