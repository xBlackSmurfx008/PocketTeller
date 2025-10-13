import { Crown, Calendar, Gift, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { useSubscription } from '@/hooks/useSubscription';
import { format } from 'date-fns';

export function SubscriptionStatus() {
  const {
    hasSubscription,
    isActive,
    isPro,
    status,
    planType,
    trialDaysRemaining,
    currentPeriodEnd,
    cancelAtPeriodEnd,
    freeMonthsRemaining,
    referralCredits,
    loading,
    openCustomerPortal,
  } = useSubscription();

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasSubscription || !isActive) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
            Free Account
          </CardTitle>
          <CardDescription>
            Upgrade to Pro for unlimited AI coaching and bank connections
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button className="w-full" onClick={() => window.location.href = '/subscription'}>
            <Crown className="mr-2 h-4 w-4" />
            Upgrade to Pro
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const trialProgress = status === 'trialing' ? ((30 - trialDaysRemaining) / 30) * 100 : 100;

  return (
    <Card className="border-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-primary" />
          PocketTeller Pro
        </CardTitle>
        <CardDescription>
          {status === 'trialing' && 'Free trial active'}
          {status === 'active' && `${planType} subscription active`}
          {cancelAtPeriodEnd && ' - Cancels at period end'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Trial Progress */}
        {status === 'trialing' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Trial Progress</span>
              <span className="font-semibold">{trialDaysRemaining} days left</span>
            </div>
            <Progress value={trialProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Your first payment will be on {currentPeriodEnd && format(new Date(currentPeriodEnd), 'MMM dd, yyyy')}
            </p>
          </div>
        )}

        {/* Active Subscription */}
        {status === 'active' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {cancelAtPeriodEnd ? 'Access until' : 'Renews on'}:
              </span>
              <span className="font-semibold">
                {currentPeriodEnd && format(new Date(currentPeriodEnd), 'MMM dd, yyyy')}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="text-xs">
                {planType === 'monthly' ? '$4.99/month' : '$32.99/year'}
              </Badge>
            </div>
          </div>
        )}

        {/* Free Months & Referrals */}
        {(freeMonthsRemaining > 0 || referralCredits > 0) && (
          <div className="pt-4 border-t space-y-2">
            {freeMonthsRemaining > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Gift className="h-4 w-4 text-green-500" />
                <span>{freeMonthsRemaining} free month{freeMonthsRemaining > 1 ? 's' : ''} remaining</span>
              </div>
            )}
            {referralCredits > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>{referralCredits} referral credit{referralCredits > 1 ? 's' : ''} earned</span>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={openCustomerPortal}
        >
          Manage Subscription
        </Button>
      </CardFooter>
    </Card>
  );
}

