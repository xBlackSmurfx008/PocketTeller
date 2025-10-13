import { Crown, Lock } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';

interface ProFeatureGateProps {
  feature: string;
  description: string;
  children?: React.ReactNode;
}

export function ProFeatureGate({ feature, description, children }: ProFeatureGateProps) {
  const { isPro, loading } = useSubscription();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (isPro) {
    return <>{children}</>;
  }

  return (
    <div className="flex items-center justify-center p-8">
      <Card className="max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Lock className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl">{feature}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
            <p className="font-semibold flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary" />
              This is a Pro feature
            </p>
            <p className="text-muted-foreground">
              Upgrade to PocketTeller Pro to unlock this feature and get:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-2">
              <li>Unlimited AI financial coaching</li>
              <li>Automatic bank connections</li>
              <li>Smart transaction categorization</li>
              <li>Advanced insights & analytics</li>
            </ul>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button 
            className="w-full" 
            onClick={() => navigate('/subscription')}
          >
            <Crown className="mr-2 h-4 w-4" />
            Upgrade to Pro - Free 30-Day Trial
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            No credit card required for trial
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

