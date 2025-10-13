import { useState } from 'react';
import { Check, Crown, Sparkles, Gift, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { SEOHead } from '@/components/SEOHead';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function Subscription() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isActive, isPro, status, trialDaysRemaining, planType, loading: subLoading } = useSubscription();
  const { createCheckoutSession, loading } = useSubscription();
  const [promoCode, setPromoCode] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    if (!user) {
      toast.error('Please sign in to subscribe');
      navigate('/auth');
      return;
    }

    setSelectedPlan(plan);
    const session = await createCheckoutSession(plan, promoCode);
    
    if (session?.url) {
      window.location.href = session.url;
    }
  };

  const features = [
    'Unlimited AI Financial Coach conversations',
    'Connect unlimited bank accounts',
    'Automatic transaction sync & categorization',
    'Advanced budgeting tools',
    'Unlimited financial goals',
    'AI-powered spending insights',
    'Document analysis (receipts, statements)',
    'Bill tracking & reminders',
    'Export data & reports',
    'Priority email support',
  ];

  return (
    <>
      <SEOHead
        title="Subscribe to PocketTeller Pro - AI Financial Coaching"
        description="Get unlimited access to AI-powered financial coaching, automated budgeting, and smart money management tools. Start your free 30-day trial today!"
      />
      
      <PublicHeader />
      
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <Badge className="mb-4" variant="secondary">
              <Sparkles className="h-3 w-3 mr-1" />
              30-Day Free Trial
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Choose Your <span className="text-primary">PocketTeller Pro</span> Plan
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get unlimited access to AI-powered financial coaching and take control of your financial future
            </p>
          </div>

          {/* Current Subscription Status */}
          {isActive && (
            <div className="max-w-md mx-auto mb-8">
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-primary" />
                    You're a Pro Member!
                  </CardTitle>
                  <CardDescription>
                    {status === 'trialing' && `${trialDaysRemaining} days left in your free trial`}
                    {status === 'active' && `${planType} plan active`}
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          )}

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
            {/* Monthly Plan */}
            <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-2xl">Monthly</CardTitle>
                <CardDescription>Perfect for trying out Pro features</CardDescription>
                <div className="mt-4">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold">$4.99</span>
                    <span className="text-muted-foreground ml-2">/month</span>
                  </div>
                  <Badge variant="secondary" className="mt-2">
                    First 30 days FREE
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {features.slice(0, 5).map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => handleSubscribe('monthly')}
                  disabled={loading || (isActive && planType === 'monthly')}
                >
                  {isActive && planType === 'monthly' ? (
                    'Current Plan'
                  ) : (
                    <>
                      Start Free Trial
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Yearly Plan */}
            <Card className="relative overflow-hidden border-primary shadow-lg">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-sm font-semibold">
                BEST VALUE
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">Yearly</CardTitle>
                <CardDescription>Save $27/year with annual billing</CardDescription>
                <div className="mt-4">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold">$32.99</span>
                    <span className="text-muted-foreground ml-2">/year</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">
                      First 30 days FREE
                    </Badge>
                    <Badge className="bg-green-500 hover:bg-green-600">
                      Save $27
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => handleSubscribe('yearly')}
                  disabled={loading || (isActive && planType === 'yearly')}
                >
                  {isActive && planType === 'yearly' ? (
                    'Current Plan'
                  ) : (
                    <>
                      Start Free Trial
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Promo Code Section */}
          <div className="max-w-md mx-auto mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Gift className="h-5 w-5" />
                  Have a Promo Code?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter code (e.g., SA2025)"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    className="uppercase"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (promoCode) {
                        toast.success(`Promo code "${promoCode}" will be applied at checkout`);
                      }
                    }}
                  >
                    Apply
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Try code <span className="font-mono font-semibold">SA2025</span> for an extended trial
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Features Grid */}
          <div className="max-w-5xl mx-auto mb-12">
            <h2 className="text-2xl font-bold text-center mb-8">
              Everything You Need for Financial Success
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <Crown className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>AI Financial Coach</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    24/7 access to your personal AI financial advisor. Get expert guidance on budgeting, saving, and investing.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Sparkles className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Smart Automation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Automatic transaction syncing and AI-powered categorization. Your finances, organized automatically.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Gift className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Insights & Goals</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    AI-generated spending insights and personalized goal tracking to help you achieve financial wellness.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* FAQ */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">How does the free trial work?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    You get full access to all Pro features for 30 days, completely free. No credit card required upfront. 
                    Cancel anytime during the trial and you won't be charged.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Yes! You can cancel your subscription at any time. Your access continues until the end of your current billing period.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">What's the referral program?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Submit 3 product suggestions and get 1 free month added to your subscription. 
                    You can earn a free month once every 30 days by providing feedback.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Is my payment information secure?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Absolutely. All payments are processed by Stripe, a PCI-compliant payment processor trusted by millions of businesses. 
                    We never store your credit card information.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <PublicFooter />
    </>
  );
}

