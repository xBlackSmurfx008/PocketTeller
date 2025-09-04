import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { CheckoutSteps } from '@/components/payments/CheckoutSteps';
import { PlanCard } from '@/components/payments/PlanCard';
import { BillingDetailsForm } from '@/components/payments/BillingDetailsForm';
import { PaymentMethodForm } from '@/components/payments/PaymentMethodForm';
import { OrderSummary } from '@/components/payments/OrderSummary';
import { Button } from '@/components/ui/button';
import { useCheckout } from '@/hooks/useCheckout';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { PRICING_PLANS } from '@/types/pricing';

export default function Checkout() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [processing, setProcessing] = useState(false);
  
  const {
    state,
    selectPlan,
    updateBillingDetails,
    selectPaymentMethod,
    setStep,
    nextStep,
    prevStep,
    processPayment
  } = useCheckout();

  // Redirect unauthenticated users to auth page
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth?next=/checkout');
    }
  }, [user, loading, navigate]);

  // Sync user email to billing details when user is available
  useEffect(() => {
    if (user?.email && !state.billingDetails.email) {
      updateBillingDetails({ email: user.email });
    }
  }, [user?.email, state.billingDetails.email, updateBillingDetails]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render if user is not authenticated (will be redirected)
  if (!user) {
    return null;
  }

  const handlePlanSelect = (plan: typeof PRICING_PLANS[0]) => {
    selectPlan(plan);
    nextStep();
  };

  const handleBillingSubmit = (details: typeof state.billingDetails) => {
    updateBillingDetails(details);
    nextStep();
  };

  const handlePaymentSubmit = (method: typeof state.paymentMethod) => {
    if (method) {
      selectPaymentMethod(method);
      nextStep();
    }
  };

  const handleOrderConfirm = async () => {
    setProcessing(true);
    try {
      const result = await processPayment();
      
      if (result.success) {
        toast({
          title: 'Payment Successful!',
          description: 'Welcome to your new financial journey.',
        });
        navigate(`/payment-success?orderId=${result.orderId}`);
      } else {
        toast({
          title: 'Payment Failed',
          description: 'There was an issue processing your payment. Please try again.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Payment Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const renderStepContent = () => {
    switch (state.step) {
      case 'plan':
        return (
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
              <p className="text-muted-foreground">Select the plan that best fits your needs</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PRICING_PLANS.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  selected={state.selectedPlan?.id === plan.id}
                  onSelect={handlePlanSelect}
                />
              ))}
            </div>
          </div>
        );

      case 'billing':
        return (
          <BillingDetailsForm
            initialData={state.billingDetails}
            onSubmit={handleBillingSubmit}
            onBack={() => setStep('plan')}
          />
        );

      case 'payment':
        return (
          <PaymentMethodForm
            onSubmit={handlePaymentSubmit}
            onBack={() => setStep('billing')}
          />
        );

      case 'review':
        if (!state.selectedPlan || !state.paymentMethod) {
          navigate('/pricing');
          return null;
        }
        return (
          <OrderSummary
            plan={state.selectedPlan}
            billingDetails={state.billingDetails}
            paymentMethod={state.paymentMethod}
            onConfirm={handleOrderConfirm}
            onBack={() => setStep('payment')}
            processing={processing}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      <SEOHead 
        title="Checkout - AI Financial Accountability"
        description="Complete your subscription to start your financial journey with AI-powered insights and tracking."
        keywords="checkout, subscription, financial app, secure payment"
      />
      
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/pricing')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Pricing
            </Button>
            <div className="flex-1" />
            <div className="text-sm text-muted-foreground">
              Secure Checkout
            </div>
          </div>

          {/* Progress Steps */}
          <CheckoutSteps 
            currentStep={state.step}
            onStepClick={(step) => {
              // Allow going back to previous steps only
              const steps = ['plan', 'billing', 'payment', 'review'];
              const currentIndex = steps.indexOf(state.step);
              const targetIndex = steps.indexOf(step);
              
              if (targetIndex <= currentIndex) {
                setStep(step);
              }
            }}
          />

          {/* Step Content */}
          <div className="pb-16">
            {renderStepContent()}
          </div>
        </div>
      </div>
    </>
  );
}