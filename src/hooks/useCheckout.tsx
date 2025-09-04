import { createContext, useContext, useState, ReactNode } from 'react';
import { CheckoutState, PricingPlan, BillingDetails, PaymentMethod, CheckoutStep } from '@/types/pricing';

interface CheckoutContextType {
  state: CheckoutState;
  selectPlan: (plan: PricingPlan) => void;
  updateBillingDetails: (details: Partial<BillingDetails>) => void;
  selectPaymentMethod: (method: PaymentMethod) => void;
  setStep: (step: CheckoutStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  resetCheckout: () => void;
  processPayment: () => Promise<{ success: boolean; orderId?: string }>;
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

const initialBillingDetails: BillingDetails = {
  firstName: '',
  lastName: '',
  email: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'US'
};

const initialState: CheckoutState = {
  selectedPlan: null,
  billingDetails: initialBillingDetails,
  paymentMethod: null,
  step: 'plan'
};

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CheckoutState>(initialState);

  const selectPlan = (plan: PricingPlan) => {
    setState(prev => ({ ...prev, selectedPlan: plan, step: 'billing' }));
  };

  const updateBillingDetails = (details: Partial<BillingDetails>) => {
    setState(prev => ({
      ...prev,
      billingDetails: { ...prev.billingDetails, ...details }
    }));
  };

  const selectPaymentMethod = (method: PaymentMethod) => {
    setState(prev => ({ ...prev, paymentMethod: method }));
  };

  const setStep = (step: CheckoutStep) => {
    setState(prev => ({ ...prev, step }));
  };

  const nextStep = () => {
    const steps: CheckoutStep[] = ['plan', 'billing', 'payment', 'review'];
    const currentIndex = steps.indexOf(state.step);
    if (currentIndex < steps.length - 1) {
      setState(prev => ({ ...prev, step: steps[currentIndex + 1] }));
    }
  };

  const prevStep = () => {
    const steps: CheckoutStep[] = ['plan', 'billing', 'payment', 'review'];
    const currentIndex = steps.indexOf(state.step);
    if (currentIndex > 0) {
      setState(prev => ({ ...prev, step: steps[currentIndex - 1] }));
    }
  };

  const resetCheckout = () => {
    setState(initialState);
  };

  const processPayment = async (): Promise<{ success: boolean; orderId?: string }> => {
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate 95% success rate
    const success = Math.random() > 0.05;
    
    if (success) {
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store order in localStorage for success page
      localStorage.setItem('lastOrder', JSON.stringify({
        orderId,
        plan: state.selectedPlan,
        billingDetails: state.billingDetails,
        date: new Date().toISOString()
      }));
      
      return { success: true, orderId };
    }
    
    return { success: false };
  };

  return (
    <CheckoutContext.Provider value={{
      state,
      selectPlan,
      updateBillingDetails,
      selectPaymentMethod,
      setStep,
      nextStep,
      prevStep,
      resetCheckout,
      processPayment
    }}>
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (context === undefined) {
    throw new Error('useCheckout must be used within a CheckoutProvider');
  }
  return context;
}