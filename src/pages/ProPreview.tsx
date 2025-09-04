import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Lock, TrendingUp, Bell, PieChart, CreditCard, Shield, Zap } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PaywallModal } from '@/components/payments/PaywallModal';
import { useSubscription } from '@/hooks/useSubscriptionMock';

export default function ProPreview() {
  const navigate = useNavigate();
  const { checkSubscription } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState('');

  const isSubscribed = checkSubscription();

  const handleFeatureClick = (feature: string) => {
    if (!isSubscribed) {
      setSelectedFeature(feature);
      setShowPaywall(true);
    }
  };

  const features = [
    {
      icon: TrendingUp,
      title: 'Advanced Analytics',
      description: 'Deep insights into your spending patterns with AI-powered recommendations',
      locked: !isSubscribed
    },
    {
      icon: Bell,
      title: 'Smart Alerts',
      description: 'Get notified about unusual spending, bill due dates, and saving opportunities',
      locked: !isSubscribed
    },
    {
      icon: PieChart,
      title: 'Custom Reports',
      description: 'Generate detailed financial reports and export your data',
      locked: !isSubscribed
    },
    {
      icon: CreditCard,
      title: 'Investment Tracking',
      description: 'Monitor your portfolio performance and get investment insights',
      locked: !isSubscribed
    },
    {
      icon: Shield,
      title: 'Priority Support',
      description: '24/7 priority customer support with dedicated account manager',
      locked: !isSubscribed
    },
    {
      icon: Zap,
      title: 'Automated Insights',
      description: 'AI automatically finds ways to save money and optimize your budget',
      locked: !isSubscribed
    }
  ];

  return (
    <>
      <SEOHead 
        title="Pro Features Preview - AI Financial Accountability"
        description="Explore premium features including advanced analytics, custom reports, and priority support."
        keywords="pro features, premium, financial analytics, reports, priority support"
      />
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold">Pro Features</h1>
                {isSubscribed ? (
                  <Badge className="bg-primary">Active</Badge>
                ) : (
                  <Badge variant="outline">Preview Mode</Badge>
                )}
              </div>
              <Button 
                variant="outline" 
                onClick={() => navigate('/dashboard')}
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-8">
          {!isSubscribed && (
            <div className="mb-8 p-6 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Lock className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">Unlock Premium Features</h2>
              </div>
              <p className="text-muted-foreground mb-4">
                You're viewing a preview of our Pro features. Upgrade to access advanced analytics, 
                custom reports, and priority support.
              </p>
              <Button onClick={() => navigate('/pricing')}>
                View Pricing Plans
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index}
                  className={`transition-all duration-300 ${
                    feature.locked 
                      ? 'opacity-75 cursor-pointer hover:shadow-lg' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => feature.locked && handleFeatureClick(feature.title)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Icon className={`w-6 h-6 ${feature.locked ? 'text-muted-foreground' : 'text-primary'}`} />
                      {feature.locked && <Lock className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <CardTitle className={feature.locked ? 'text-muted-foreground' : ''}>
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-sm ${feature.locked ? 'text-muted-foreground' : ''}`}>
                      {feature.description}
                    </p>
                    {feature.locked && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-4 w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFeatureClick(feature.title);
                        }}
                      >
                        Unlock Feature
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Demo Content */}
          <div className="mt-12 space-y-8">
            <h2 className="text-2xl font-bold text-center mb-8">
              See What You're Missing
            </h2>

            {/* Mock Analytics Dashboard */}
            <Card className={!isSubscribed ? 'opacity-50 pointer-events-none' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Advanced Analytics Dashboard
                  {!isSubscribed && <Lock className="w-4 h-4 text-muted-foreground" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">$2,847</div>
                    <div className="text-sm text-muted-foreground">Total Saved</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-success">23%</div>
                    <div className="text-sm text-muted-foreground">Spending Reduction</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-accent">94</div>
                    <div className="text-sm text-muted-foreground">Financial Score</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mock Investment Tracker */}
            <Card className={!isSubscribed ? 'opacity-50 pointer-events-none' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Investment Portfolio
                  {!isSubscribed && <Lock className="w-4 h-4 text-muted-foreground" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Portfolio Value</span>
                    <span className="font-bold text-lg">$45,892.34</span>
                  </div>
                  <div className="flex justify-between items-center text-success">
                    <span>Today's Gain</span>
                    <span>+$234.67 (+0.51%)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <PaywallModal
          isOpen={showPaywall}
          onClose={() => setShowPaywall(false)}
          feature={selectedFeature}
          description="This premium feature requires a Pro or Premium subscription to access."
        />
      </div>
    </>
  );
}