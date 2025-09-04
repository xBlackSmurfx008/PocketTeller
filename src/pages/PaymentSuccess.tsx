import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Download, Mail, Smartphone } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscriptionMock';

interface OrderData {
  orderId: string;
  plan: any;
  billingDetails: any;
  date: string;
}

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const { upgrade } = useSubscription();
  
  const orderId = searchParams.get('orderId');

  useEffect(() => {
    // Get order data from localStorage
    const storedOrder = localStorage.getItem('lastOrder');
    if (storedOrder) {
      try {
        const parsed = JSON.parse(storedOrder);
        if (parsed.orderId === orderId) {
          setOrderData(parsed);
          
          // Auto-unlock subscription for purchased plan
          if (parsed.plan) {
            upgrade(parsed.plan.id);
          }
        }
      } catch (error) {
        console.error('Error parsing order data:', error);
      }
    }

    // Clear the stored order after 5 minutes for security
    const timeout = setTimeout(() => {
      localStorage.removeItem('lastOrder');
    }, 5 * 60 * 1000);

    return () => clearTimeout(timeout);
  }, [orderId, upgrade]);

  const nextSteps = [
    {
      icon: Smartphone,
      title: 'Download Mobile App',
      description: 'Get the mobile app for iOS and Android to track on-the-go',
      action: 'Download Now'
    },
    {
      icon: Mail,
      title: 'Check Your Email',
      description: 'We\'ve sent account setup instructions to your email',
      action: 'Open Email'
    },
    {
      icon: Download,
      title: 'Connect Your Accounts',
      description: 'Link your bank accounts to start tracking automatically',
      action: 'Get Started'
    }
  ];

  if (!orderData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <p className="text-muted-foreground mb-6">
            We couldn't find your order details. Please check your email for confirmation.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEOHead 
        title="Payment Successful - Welcome to AI Financial Accountability"
        description="Your payment was successful! Welcome to your financial journey."
        keywords="payment success, subscription confirmed, financial app"
      />
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          {/* Success Header */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Welcome to Your Financial Journey!</h1>
            <p className="text-xl text-muted-foreground mb-2">
              Your payment was successful and your account is now active.
            </p>
            <Badge className="bg-green-100 text-green-800">
              Order #{orderData.orderId}
            </Badge>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{orderData.plan.name} Plan</span>
                  <span className="text-lg font-bold">${orderData.plan.price}/month</span>
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3">What you get:</h4>
                  <div className="space-y-2">
                    {orderData.plan.features.slice(0, 5).map((feature: string, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Order Date</p>
                      <p className="font-medium">
                        {new Date(orderData.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Billing Email</p>
                      <p className="font-medium">{orderData.billingDetails.email}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle>Next Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {nextSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">{step.title}</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          {step.description}
                        </p>
                        <Button size="sm" variant="outline">
                          {step.action}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-12">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-4">Ready to Transform Your Finances?</h2>
                <p className="text-muted-foreground mb-6">
                  Your account is active and ready to use. Start by connecting your first bank account 
                  and let our AI begin analyzing your spending patterns.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={() => navigate('/dashboard')}
                    size="lg"
                    className="h-12 px-8"
                  >
                    Go to Dashboard
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/goals')}
                    size="lg"
                    className="h-12 px-8"
                  >
                    Set Financial Goals
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}