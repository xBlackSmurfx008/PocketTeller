import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, User, Share2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ShareBudgetDialog } from '@/components/ShareBudgetDialog';
import NotificationBell from '@/components/NotificationBell';
import { SubscriptionStatus } from '@/components/SubscriptionStatus';
import { ReferralProgram } from '@/components/ReferralProgram';

export default function ProfileSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [budgetData, setBudgetData] = useState<any>(null);

  useEffect(() => {
    fetchBudgetData();
  }, [user]);

  const fetchBudgetData = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('budget')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setBudgetData(data);
      }
    } catch (error) {
      console.error('Error fetching budget data:', error);
    }
  };

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
              <User className="h-6 w-6" />
              Profile Information
            </h1>
            <p className="text-muted-foreground">Manage your account details and preferences</p>
          </div>
        </div>

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-sm">{user?.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">User ID</label>
              <p className="text-xs font-mono text-muted-foreground">{user?.id}</p>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Status */}
        <SubscriptionStatus />

        {/* Referral Program */}
        <ReferralProgram />

        {/* App Actions */}
        <Card>
          <CardHeader>
            <CardTitle>App Actions</CardTitle>
            <CardDescription>Quick access to app features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              {budgetData && (
                <ShareBudgetDialog budgetData={budgetData}>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    Share Budget
                  </Button>
                </ShareBudgetDialog>
              )}
              <NotificationBell />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
