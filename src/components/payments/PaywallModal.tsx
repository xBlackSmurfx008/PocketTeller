import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Crown, Star, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { PRICING_PLANS } from '@/types/pricing';
import { useCheckout } from '@/hooks/useCheckout';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: string;
  description?: string;
}

export function PaywallModal({ isOpen, onClose, feature, description }: PaywallModalProps) {
  const navigate = useNavigate();
  const { selectPlan } = useCheckout();
  const [selectedPlanId, setSelectedPlanId] = useState('pro');

  const selectedPlan = PRICING_PLANS.find(p => p.id === selectedPlanId) || PRICING_PLANS[1];

  const handleUpgrade = () => {
    selectPlan(selectedPlan);
    onClose();
    navigate('/checkout');
  };

  const benefits = [
    'Unlimited bank connections',
    'Advanced AI insights',
    'Custom categories & reports',
    'Priority support',
    'Investment tracking',
    'Bill reminders'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Crown className="w-6 h-6 text-primary" />
            Unlock Premium Features
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Feature Info */}
          <div className="text-center p-6 bg-muted/30 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">{feature}</h3>
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>

          {/* Plan Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PRICING_PLANS.map((plan) => (
              <Card 
                key={plan.id}
                className={`cursor-pointer transition-all ${
                  selectedPlanId === plan.id ? 'ring-2 ring-primary' : 'hover:shadow-md'
                } ${plan.popular ? 'border-primary' : ''}`}
                onClick={() => setSelectedPlanId(plan.id)}
              >
                <CardContent className="p-4 text-center">
                  {plan.popular && (
                    <Badge className="mb-2 bg-primary">
                      <Star className="w-3 h-3 mr-1" />
                      Popular
                    </Badge>
                  )}
                  <h4 className="font-semibold">{plan.name}</h4>
                  <div className="mt-2">
                    <span className="text-2xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground">/{plan.interval}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <Check className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm">{benefit}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Maybe Later
            </Button>
            <Button onClick={handleUpgrade} className="flex-1">
              Upgrade to {selectedPlan.name} - ${selectedPlan.price}/{selectedPlan.interval}
            </Button>
          </div>

          {/* Guarantee */}
          <p className="text-center text-sm text-muted-foreground">
            30-day money-back guarantee • Cancel anytime
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}