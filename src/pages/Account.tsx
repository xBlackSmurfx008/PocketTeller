
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLayoutPreference } from '@/hooks/useLayoutPreference';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, AlertTriangle, Monitor, Smartphone } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PlaidLink } from '@/components/PlaidLink';
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
  const { user, signOut } = useAuth();
  const { layoutMode, setLayoutMode } = useLayoutPreference();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasPlaidToken, setHasPlaidToken] = useState(false);

  useEffect(() => {
    checkPlaidConnection();
  }, [user]);

  const checkPlaidConnection = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('encrypted_plaid_token')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!error && data?.encrypted_plaid_token) {
        setHasPlaidToken(true);
      }
    } catch (error) {
      console.error('Error checking Plaid connection:', error);
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
      ]);

      // Update profile to remove encrypted Plaid token
      await supabase
        .from('profiles')
        .update({ 
          encrypted_plaid_token: null,
          token_iv: null 
        })
        .eq('user_id', user.id);

      toast({
        title: "Data Deleted",
        description: "All your financial data has been permanently deleted.",
      });

      // Navigate back to dashboard
      navigate('/');
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
    <div className="min-h-screen bg-background">
      <header className="border-b border-border p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Account Settings</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
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

        <Card>
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bank Connection</CardTitle>
            <CardDescription>
              {hasPlaidToken 
                ? "Manage your connected bank account - sync data or disconnect."
                : "Connect your bank account to automatically sync transactions and get personalized insights."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PlaidLink 
              hasPlaidToken={hasPlaidToken} 
              onConnectionChange={checkPlaidConnection} 
            />
          </CardContent>
        </Card>

        <Card className="border-destructive">
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
                  <Button variant="destructive" className="w-full sm:w-auto">
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
                      </ul>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAllData}
                      disabled={isDeleting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
              <Button variant="outline" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
