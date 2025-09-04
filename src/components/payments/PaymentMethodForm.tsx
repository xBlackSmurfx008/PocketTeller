import { useState } from 'react';
import { CreditCard, Smartphone, Apple } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PaymentMethod } from '@/types/pricing';

interface PaymentMethodFormProps {
  onSubmit: (method: PaymentMethod) => void;
  onBack: () => void;
}

export function PaymentMethodForm({ onSubmit, onBack }: PaymentMethodFormProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('card');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });

  const handleSubmit = () => {
    let paymentMethod: PaymentMethod;
    
    switch (selectedMethod) {
      case 'card':
        paymentMethod = {
          type: 'card',
          lastFour: cardDetails.number.slice(-4),
          brand: 'visa' // Simplified for demo
        };
        break;
      case 'paypal':
        paymentMethod = { type: 'paypal' };
        break;
      case 'apple_pay':
        paymentMethod = { type: 'apple_pay' };
        break;
      case 'google_pay':
        paymentMethod = { type: 'google_pay' };
        break;
      default:
        return;
    }
    
    onSubmit(paymentMethod);
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = cleaned.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return cleaned;
    }
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Payment Method</h2>
        <p className="text-muted-foreground">Choose your preferred payment method</p>
      </div>

      <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod} className="space-y-4">
        {/* Credit Card */}
        <Card className={`cursor-pointer transition-colors ${selectedMethod === 'card' ? 'ring-2 ring-primary' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="card" id="card" />
              <Label htmlFor="card" className="flex items-center gap-3 cursor-pointer flex-1">
                <CreditCard className="w-5 h-5" />
                <span>Credit or Debit Card</span>
              </Label>
            </div>
            
            {selectedMethod === 'card' && (
              <div className="mt-4 space-y-4 pl-8">
                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 1234 1234 1234"
                    value={cardDetails.number}
                    onChange={(e) => setCardDetails(prev => ({ 
                      ...prev, 
                      number: formatCardNumber(e.target.value) 
                    }))}
                    maxLength={19}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      value={cardDetails.expiry}
                      onChange={(e) => setCardDetails(prev => ({ 
                        ...prev, 
                        expiry: formatExpiry(e.target.value) 
                      }))}
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvc">CVC</Label>
                    <Input
                      id="cvc"
                      placeholder="123"
                      value={cardDetails.cvc}
                      onChange={(e) => setCardDetails(prev => ({ 
                        ...prev, 
                        cvc: e.target.value.replace(/\D/g, '').substring(0, 3) 
                      }))}
                      maxLength={3}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="cardName">Cardholder Name</Label>
                  <Input
                    id="cardName"
                    placeholder="John Doe"
                    value={cardDetails.name}
                    onChange={(e) => setCardDetails(prev => ({ 
                      ...prev, 
                      name: e.target.value 
                    }))}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* PayPal */}
        <Card className={`cursor-pointer transition-colors ${selectedMethod === 'paypal' ? 'ring-2 ring-primary' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="paypal" id="paypal" />
              <Label htmlFor="paypal" className="flex items-center gap-3 cursor-pointer">
                <div className="w-5 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
                  P
                </div>
                <span>PayPal</span>
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Apple Pay */}
        <Card className={`cursor-pointer transition-colors ${selectedMethod === 'apple_pay' ? 'ring-2 ring-primary' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="apple_pay" id="apple_pay" />
              <Label htmlFor="apple_pay" className="flex items-center gap-3 cursor-pointer">
                <Apple className="w-5 h-5" />
                <span>Apple Pay</span>
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Google Pay */}
        <Card className={`cursor-pointer transition-colors ${selectedMethod === 'google_pay' ? 'ring-2 ring-primary' : ''}`}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="google_pay" id="google_pay" />
              <Label htmlFor="google_pay" className="flex items-center gap-3 cursor-pointer">
                <Smartphone className="w-5 h-5" />
                <span>Google Pay</span>
              </Label>
            </div>
          </CardContent>
        </Card>
      </RadioGroup>

      <div className="flex gap-4 pt-6">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Back to Billing
        </Button>
        <Button onClick={handleSubmit} className="flex-1">
          Continue to Review
        </Button>
      </div>
    </div>
  );
}