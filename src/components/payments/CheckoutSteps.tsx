import { Check } from 'lucide-react';
import { CheckoutStep } from '@/types/pricing';

interface CheckoutStepsProps {
  currentStep: CheckoutStep;
  onStepClick?: (step: CheckoutStep) => void;
}

const steps = [
  { id: 'plan' as CheckoutStep, name: 'Choose Plan', description: 'Select your subscription' },
  { id: 'billing' as CheckoutStep, name: 'Billing Details', description: 'Enter your information' },
  { id: 'payment' as CheckoutStep, name: 'Payment', description: 'Payment method' },
  { id: 'review' as CheckoutStep, name: 'Review', description: 'Confirm your order' }
];

export function CheckoutSteps({ currentStep, onStepClick }: CheckoutStepsProps) {
  const getCurrentStepIndex = () => steps.findIndex(step => step.id === currentStep);
  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isClickable = index <= currentStepIndex && onStepClick;

          return (
            <div key={step.id} className="flex items-center flex-1">
              <div 
                className={`flex items-center ${isClickable ? 'cursor-pointer' : ''}`}
                onClick={() => isClickable && onStepClick(step.id)}
              >
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                  ${isCompleted 
                    ? 'bg-primary text-primary-foreground' 
                    : isCurrent 
                    ? 'bg-primary/20 text-primary border-2 border-primary' 
                    : 'bg-muted text-muted-foreground'
                  }
                `}>
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className={`text-sm font-medium ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
                    {step.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
              </div>
              
              {index < steps.length - 1 && (
                <div className={`flex-1 h-px mx-4 ${
                  isCompleted ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}