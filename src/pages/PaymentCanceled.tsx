import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, HelpCircle, Mail } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PaymentCanceled() {
  const navigate = useNavigate();

  const commonReasons = [
    {
      title: 'Changed your mind?',
      description: 'No worries! You can always upgrade later when you\'re ready.',
      action: 'Continue Free Trial',
      onClick: () => navigate('/dashboard')
    },
    {
      title: 'Need help choosing?',
      description: 'Our support team can help you pick the right plan for your needs.',
      action: 'Contact Support',
      onClick: () => navigate('/contact')
    },
    {
      title: 'Payment issues?',
      description: 'Try a different payment method or contact your bank.',
      action: 'Try Again',
      onClick: () => navigate('/pricing')
    }
  ];

  return (
    <>
      <SEOHead 
        title="Payment Canceled - AI Financial Accountability"
        description="Your payment was canceled. You can still continue with our free features or try again later."
        keywords="payment canceled, subscription, financial app"
      />
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-orange-600" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Payment Canceled</h1>
            <p className="text-xl text-muted-foreground">
              Your payment was canceled, but you can still explore our free features.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* What happened */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  What happened?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your payment process was interrupted or canceled. This could be due to:
                </p>
                <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
                  <li>Clicking the back button during payment</li>
                  <li>Payment method declined</li>
                  <li>Network connectivity issues</li>
                  <li>Simply changing your mind (which is totally fine!)</li>
                </ul>
              </CardContent>
            </Card>

            {/* Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {commonReasons.map((reason, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-2">{reason.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {reason.description}
                    </p>
                    <Button onClick={reason.onClick} className="w-full">
                      {reason.action}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* What you can still do */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>You Can Still:</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Free Features Available</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Connect 1 bank account</li>
                      <li>• Basic spending tracking</li>
                      <li>• Simple budget categories</li>
                      <li>• Goal tracking (limited)</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Get Support</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Live chat support</li>
                      <li>• Email assistance</li>
                      <li>• Help choosing plans</li>
                      <li>• Technical support</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Call to Action */}
            <Card>
              <CardContent className="p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Ready to Try Again?</h2>
                <p className="text-muted-foreground mb-6">
                  When you're ready, we'll be here to help you take control of your finances.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={() => navigate('/pricing')}
                    size="lg"
                    className="h-12 px-8"
                  >
                    View Pricing Plans
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/dashboard')}
                    size="lg"
                    className="h-12 px-8"
                  >
                    Continue Free
                  </Button>
                </div>
                
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm text-muted-foreground mb-4">
                    Need help or have questions?
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate('/contact')}
                      className="flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Contact Support
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate('/')}
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Home
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}