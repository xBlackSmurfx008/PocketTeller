export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  popular?: boolean;
  description: string;
}

export interface CheckoutState {
  selectedPlan: PricingPlan | null;
  billingDetails: BillingDetails;
  paymentMethod: PaymentMethod | null;
  step: CheckoutStep;
}

export interface BillingDetails {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface PaymentMethod {
  type: 'card' | 'paypal' | 'apple_pay' | 'google_pay';
  lastFour?: string;
  brand?: string;
}

export type CheckoutStep = 'plan' | 'billing' | 'payment' | 'review';

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'basic',
    name: 'Basic',
    price: 9.99,
    interval: 'month',
    description: 'Perfect for getting started with financial tracking',
    features: [
      'Connect up to 2 bank accounts',
      'Basic spending insights',
      'Goal tracking',
      'Mobile app access',
      'Email support'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19.99,
    interval: 'month',
    description: 'Advanced features for serious financial management',
    popular: true,
    features: [
      'Unlimited bank accounts',
      'Advanced AI insights',
      'Investment tracking',
      'Bill reminders',
      'Priority support',
      'Custom categories',
      'Export data'
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 39.99,
    interval: 'month',
    description: 'Complete financial ecosystem for power users',
    features: [
      'Everything in Pro',
      'Personal financial advisor',
      'Tax optimization tips',
      'Credit score monitoring',
      'White-glove onboarding',
      'Phone support',
      'Custom reports'
    ]
  }
];