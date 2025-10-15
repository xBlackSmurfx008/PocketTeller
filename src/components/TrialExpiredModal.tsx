import { AlertTriangle, Crown, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';

interface TrialExpiredModalProps {
  open: boolean;
  trialEndDate?: string | null;
}

export function TrialExpiredModal({ open, trialEndDate }: TrialExpiredModalProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut } = useAuth();
  const [deleting, setDeleting] = useState(false);

  const handleUpgrade = () => {
    navigate('/subscription');
  };

  const handleDeleteData = async () => {
    if (!confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);

    try {
      // Delete user data (this will cascade delete all related data due to foreign keys)
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not found');
      }

      // Delete user's data from all tables
      const tables = [
        'transactions',
        'accounts',
        'budgets',
        'goals',
        'subscriptions',
        'subscription_events',
        'ai_coach_messages',
        'notifications',
      ];

      for (const table of tables) {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('user_id', user.id);
        
        if (error && error.code !== 'PGRST116') {
          console.error(`Error deleting from ${table}:`, error);
        }
      }

      // Sign out and redirect
      await signOut();
      toast({
        title: 'Data deleted',
        description: 'Your account data has been permanently deleted.',
      });
      navigate('/');
    } catch (error: any) {
      console.error('Error deleting data:', error);
      toast({
        title: 'Deletion failed',
        description: error.message || 'Failed to delete your data',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-destructive/10 rounded-full">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">Your Free Trial Has Ended</DialogTitle>
          <DialogDescription className="text-center text-base">
            {trialEndDate && (
              <p className="mb-3">
                Your 30-day free trial ended on{' '}
                {new Date(trialEndDate).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            )}
            <p>
              To continue using PocketTeller Pro features, please upgrade to a paid plan.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted p-4 rounded-lg space-y-3 my-4">
          <div className="flex items-start gap-3">
            <Crown className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">What you're missing:</p>
              <ul className="text-sm text-muted-foreground space-y-1 mt-2">
                <li>• Unlimited AI financial coaching</li>
                <li>• Automatic bank connections & syncing</li>
                <li>• Smart transaction categorization</li>
                <li>• Advanced insights & analytics</li>
                <li>• Budget tracking & goal management</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            className="w-full"
            size="lg"
            onClick={handleUpgrade}
          >
            <Crown className="mr-2 h-4 w-4" />
            Upgrade to Pro - Starting at $15 for 6 Months
          </Button>

          <Button
            variant="outline"
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            size="lg"
            onClick={handleDeleteData}
            disabled={deleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {deleting ? 'Deleting...' : 'Delete My Data & Sign Out'}
          </Button>
        </DialogFooter>

        <p className="text-xs text-center text-muted-foreground mt-4">
          Your data will be saved for 30 days if you choose to upgrade later
        </p>
      </DialogContent>
    </Dialog>
  );
}

