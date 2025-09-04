import { Check, Star } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PricingPlan } from '@/types/pricing';

interface PlanCardProps {
  plan: PricingPlan;
  selected?: boolean;
  onSelect: (plan: PricingPlan) => void;
}

export function PlanCard({ plan, selected, onSelect }: PlanCardProps) {
  return (
    <Card className={`relative transition-all duration-300 ${
      selected ? 'ring-2 ring-primary' : 'hover:shadow-lg'
    } ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}>
      {plan.popular && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
          <Star className="w-3 h-3 mr-1" />
          Most Popular
        </Badge>
      )}
      
      <CardHeader className="text-center pb-4">
        <h3 className="text-2xl font-bold">{plan.name}</h3>
        <p className="text-muted-foreground text-sm">{plan.description}</p>
        <div className="mt-4">
          <span className="text-4xl font-bold">${plan.price.toFixed(2)}</span>
          <span className="text-muted-foreground">/{plan.interval}</span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {plan.features.map((feature, index) => (
          <div key={index} className="flex items-center gap-3">
            <Check className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="text-sm">{feature}</span>
          </div>
        ))}
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={() => onSelect(plan)}
          variant={selected ? "default" : plan.popular ? "default" : "outline"}
          className="w-full"
        >
          {selected ? 'Selected' : 'Choose Plan'}
        </Button>
      </CardFooter>
    </Card>
  );
}