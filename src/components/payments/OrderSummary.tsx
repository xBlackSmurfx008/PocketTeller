import { Check, Shield, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { PricingPlan, BillingDetails, PaymentMethod } from '@/types/pricing';

interface OrderSummaryProps {
  plan: PricingPlan;
  billingDetails: BillingDetails;
  paymentMethod: PaymentMethod;
  onConfirm: () => void;
  onBack: () => void;
  processing?: boolean;
}

export function OrderSummary({ 
  plan, 
  billingDetails, 
  paymentMethod, 
  onConfirm, 
  onBack, 
  processing 
}: OrderSummaryProps) {
  const subtotal = plan.price;
  const tax = subtotal * 0.08; // 8% tax for demo
  const total = subtotal + tax;

  const getPaymentMethodDisplay = () => {
    switch (paymentMethod.type) {
      case 'card':
        return `${paymentMethod.brand?.toUpperCase()} •••• ${paymentMethod.lastFour}`;
      case 'paypal':
        return 'PayPal';
      case 'apple_pay':
        return 'Apple Pay';
      case 'google_pay':
        return 'Google Pay';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Review Your Order</h2>
        <p className="text-muted-foreground">Please review your order details before confirming</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Details */}
        <div className="space-y-6">
          {/* Plan Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {plan.name} Plan
                {plan.popular && <Badge>Popular</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Monthly subscription</span>
                  <span className="font-medium">${plan.price}/month</span>
                </div>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Included features:</h4>
                  {plan.features.slice(0, 4).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                  {plan.features.length > 4 && (
                    <p className="text-sm text-muted-foreground">
                      +{plan.features.length - 4} more features
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing Information */}
          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">{billingDetails.firstName} {billingDetails.lastName}</span>
                </p>
                <p className="text-sm text-muted-foreground">{billingDetails.email}</p>
                <p className="text-sm text-muted-foreground">
                  {billingDetails.address}<br />
                  {billingDetails.city}, {billingDetails.state} {billingDetails.zipCode}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{getPaymentMethodDisplay()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>{plan.name} Plan (Monthly)</span>
                <span>${plan.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium text-lg">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              
              <div className="pt-4 space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>Secured by 256-bit SSL encryption</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Cancel anytime. No hidden fees.</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Money Back Guarantee */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">30-Day Money Back Guarantee</h4>
                  <p className="text-sm text-muted-foreground">
                    Not satisfied? Get a full refund within 30 days.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={onConfirm} 
              className="w-full h-12 text-lg"
              disabled={processing}
            >
              {processing ? 'Processing...' : `Complete Order - $${total.toFixed(2)}`}
            </Button>
            <Button 
              variant="outline" 
              onClick={onBack} 
              className="w-full"
              disabled={processing}
            >
              Back to Payment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}