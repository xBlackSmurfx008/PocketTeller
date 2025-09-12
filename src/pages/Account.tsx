import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSignOutAction } from '@/hooks/useSignOutAction';
import { useLayoutPreference } from '@/hooks/useLayoutPreference';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Trash2, AlertTriangle, Monitor, Smartphone, Share2 } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ShareBudgetDialog } from '@/components/ShareBudgetDialog';
import NotificationBell from '@/components/NotificationBell';
import { PlaidLink } from '@/components/PlaidLink';
import { PlaidSecuritySettings } from '@/components/PlaidSecuritySettings';
import { Reveal } from '@/components/Reveal';
import NotificationSettings from '@/components/NotificationSettings';
import NotificationInbox from '@/components/NotificationInbox';
import { useAccent, type AccentColor } from '@/contexts/AccentProvider';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Account() {
  const { user } = useAuth();
  const { handleSignOut } = useSignOutAction();
  const { layoutMode, setLayoutMode } = useLayoutPreference();
  const { accentColor, setAccentColor } = useAccent();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasPlaidToken, setHasPlaidToken] = useState(false);
  const [budgetData, setBudgetData] = useState<any>(null);

  useEffect(() => {
    checkPlaidConnection();
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
      if (import.meta.env.DEV) {
        console.error('Error fetching budget data:', error);
      }
    }
  };

  const checkPlaidConnection = async () => {
    if (!user) return;
    
    try {
      // Use direct profiles query for consistency with Dashboard
      const { data, error } = await supabase
        .from('profiles')
        .select('encrypted_plaid_token')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data?.encrypted_plaid_token) {
        setHasPlaidToken(true);
      } else {
        setHasPlaidToken(false);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error checking Plaid connection:', error);
      }
      setHasPlaidToken(false);
    }
  };

  const handleDeleteAllData = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    try {
      // Delete chat uploads from storage
      const { data: files } = await supabase.storage
        .from('chat-uploads')
        .list(user.id);
      
      if (files && files.length > 0) {
        const filePaths = files.map(file => `${user.id}/${file.name}`);
        await supabase.storage
          .from('chat-uploads')
          .remove(filePaths);
      }

      // Delete all user data in correct order due to foreign key constraints
      await Promise.all([
        supabase.from('conversations').delete().eq('user_id', user.id),
        supabase.from('transactions').delete().eq('user_id', user.id),
        supabase.from('bills').delete().eq('user_id', user.id),
        supabase.from('accounts').delete().eq('user_id', user.id),
        supabase.from('goals').delete().eq('user_id', user.id),
        supabase.from('budget').delete().eq('user_id', user.id),
        supabase.from('plaid_token_audit_log').delete().eq('user_id', user.id),
        supabase.from('budget_shares').delete().eq('user_id', user.id),
      ]);

      // Update profile to remove encrypted Plaid token and reset security settings
      await supabase
        .from('profiles')
        .update({ 
          encrypted_plaid_token: null,
          token_iv: null,
          token_access_count: 0,
          security_alerts_enabled: false,
          last_suspicious_access_at: null,
          last_token_rotation: null
        })
        .eq('user_id', user.id);

      toast({
        title: "Data Deleted",
        description: "All your financial data has been permanently deleted.",
      });

      // Navigate back to dashboard
      navigate('/home');
    } catch (error) {
      console.error('Error deleting data:', error);
      toast({
        title: "Deletion Failed",
        description: "Failed to delete your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background content-visible">
      <main className="max-w-4xl mx-auto pt-perfect px-3 pb-3 sm:pt-perfect sm:px-4 sm:pb-4 space-y-4 sm:space-y-6 content-visible content-container">
        <Reveal>
          <Card className="card-hover-lift">
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
        </Reveal>

        <Reveal delay={50}>
          <Card className="card-hover-lift">
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
        </Reveal>

        <Reveal delay={100}>
          <Card className="card-hover-lift">
            <CardHeader>
              <CardTitle>Layout & Display</CardTitle>
              <CardDescription>Customize how Budget AI looks and feels</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Theme</p>
                  <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
                </div>
                <ThemeToggle />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {layoutMode === 'desktop' ? (
                      <Monitor className="h-4 w-4 text-primary" />
                    ) : (
                      <Smartphone className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">Force Desktop Layout</p>
                    <p className="text-sm text-muted-foreground">
                      Use desktop layout on mobile devices
                    </p>
                  </div>
                </div>
                <Switch
                  checked={layoutMode === 'desktop'}
                  onCheckedChange={(checked) => setLayoutMode(checked ? 'desktop' : 'auto')}
                />
              </div>

              <div className="space-y-3">
                <div>
                  <p className="font-medium">Accent Color</p>
                  <p className="text-sm text-muted-foreground">Choose your preferred accent color</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                  {(['violet', 'blue', 'emerald', 'amber', 'rose'] as AccentColor[]).map((color) => (
                    <button
                      key={color}
                      onClick={() => setAccentColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        accentColor === color 
                          ? 'border-primary ring-2 ring-primary/20' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      style={{
                        backgroundColor: `hsl(${
                          color === 'violet' ? '262 83% 58%' :
                          color === 'blue' ? '221 83% 53%' :
                          color === 'emerald' ? '142 76% 36%' :
                          color === 'amber' ? '45 93% 47%' :
                          '330 81% 60%'
                        })`
                      }}
                      aria-label={`Set accent color to ${color}`}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={150}>
          <Card className="card-hover-lift">
            <CardHeader>
              <CardTitle>Bank Connection</CardTitle>
              <CardDescription>
                {hasPlaidToken 
                  ? "Manage your connected bank account - sync data or disconnect."
                  : "Connect your bank account to automatically sync transactions and get personalized insights."
                }
                {!hasPlaidToken && (
                  <>
                    <br />
                    <span className="text-xs text-muted-foreground mt-2 block">
                      For testing, use: <strong>Username:</strong> user_good, <strong>Password:</strong> pass_good, <strong>Phone:</strong> 415-555-0011
                    </span>
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PlaidLink 
                hasPlaidToken={hasPlaidToken} 
                onConnectionChange={checkPlaidConnection} 
              />
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={200}>
          <PlaidSecuritySettings />
        </Reveal>

        <Reveal delay={250}>
          <NotificationSettings />
        </Reveal>

        <Reveal delay={300}>
          <NotificationInbox />
        </Reveal>

        <Reveal delay={350}>
          <Card className="border-destructive card-hover-lift">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                These actions cannot be undone. Please be careful.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full sm:w-auto ripple-effect">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete All My Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Are you absolutely sure?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete all your:
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Transaction history</li>
                          <li>Account information</li>
                          <li>Budget data</li>
                          <li>Goals and targets</li>
                          <li>Bills and reminders</li>
                          <li>Chat conversation history</li>
                          <li>Uploaded files and documents</li>
                          <li>Bank connection (Plaid token)</li>
                          <li>Security audit logs</li>
                          <li>Budget shares</li>
                        </ul>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAllData}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 ripple-effect"
                      >
                        {isDeleting ? 'Deleting...' : 'Delete Everything'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <p className="text-xs text-muted-foreground">
                  This will permanently delete all your financial data from Budget AI.
                </p>
              </div>

              <div className="pt-4 border-t">
                <Button variant="outline" onClick={handleSignOut} className="ripple-effect">
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </Reveal>
      </main>
    </div>
  );
}
