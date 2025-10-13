import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { Mail, X, RotateCcw } from 'lucide-react';
import { getErrorMessage } from '@/utils/authConfig';

/**
 * Email Confirmation Banner Component
 * 
 * Shows a reminder at the top of the app for users who haven't confirmed their email
 * Allows them to:
 * - Resend confirmation email
 * - Dismiss the banner (temporarily)
 */
export function EmailConfirmationBanner() {
  const { user, resendConfirmation } = useAuth();
  const { toast } = useToast();
  const [dismissed, setDismissed] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Check if user email is confirmed
  // In Supabase, confirmed users have email_confirmed_at or confirmed_at field
  const isEmailConfirmed = user?.email_confirmed_at || user?.confirmed_at;

  // Don't show if:
  // - No user logged in
  // - Email already confirmed
  // - Banner was dismissed
  if (!user || isEmailConfirmed || dismissed) {
    return null;
  }

  const handleResend = async () => {
    if (!user.email || resendCooldown > 0) return;

    setResendLoading(true);

    const { error } = await resendConfirmation(user.email);

    if (error) {
      toast({
        title: "Failed to resend",
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } else {
      toast({
        title: "Confirmation email sent!",
        description: `Check your email (${user.email}) including spam folder.`,
      });

      // Start 60-second cooldown
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    setResendLoading(false);
  };

  const handleDismiss = () => {
    setDismissed(true);
    // Banner will reappear on next page load/session
  };

  return (
    <Alert className="rounded-none border-x-0 border-t-0 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Mail className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
          <div className="flex-1">
            <AlertDescription className="text-sm text-amber-900 dark:text-amber-100">
              <span className="font-medium">Please confirm your email address</span>
              <span className="text-amber-700 dark:text-amber-300 ml-1">
                to unlock all features and ensure account security.
              </span>
              <span className="block mt-1 text-xs text-amber-600 dark:text-amber-400">
                Check your inbox at <span className="font-medium">{user.email}</span> for the confirmation link.
              </span>
            </AlertDescription>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResend}
            disabled={resendLoading || resendCooldown > 0}
            className="whitespace-nowrap border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/50"
          >
            <RotateCcw className="h-3 w-3 mr-1.5" />
            {resendCooldown > 0 ? `Wait ${resendCooldown}s` : 'Resend Email'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 w-8 p-0 hover:bg-amber-100 dark:hover:bg-amber-900/50"
          >
            <X className="h-4 w-4 text-amber-600 dark:text-amber-500" />
          </Button>
        </div>
      </div>
    </Alert>
  );
}

