import { useNavigate } from 'react-router-dom';
import { Shield, Star, Users, TrendingUp } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { PlanCard } from '@/components/payments/PlanCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PRICING_PLANS, PricingPlan } from '@/types/pricing';
import { useCheckout } from '@/hooks/useCheckout';

export default function Pricing() {
  const navigate = useNavigate();
  const { selectPlan } = useCheckout();

  const handleSelectPlan = (plan: PricingPlan) => {
    selectPlan(plan);
    navigate('/checkout');
  };

  const features = [
    {
      icon: Shield,
      title: 'Bank-Level Security',
      description: '256-bit SSL encryption and read-only access to protect your data'
    },
    {
      icon: Users,
      title: 'Trusted by 50,000+ Users',
      description: 'Join thousands who have taken control of their finances'
    },
    {
      icon: TrendingUp,
      title: 'Average $1,200 Saved',
      description: 'Users save an average of $1,200 per year with our insights'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Marketing Manager',
      content: 'This app completely transformed how I handle my finances. I saved $800 in the first 3 months!',
      rating: 5
    },
    {
      name: 'Mike Chen',
      role: 'Software Engineer',
      content: 'The AI insights are incredibly accurate. It caught spending patterns I never noticed.',
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      role: 'Teacher',
      content: 'Simple, intuitive, and powerful. Finally, a financial app that actually helps.',
      rating: 5
    }
  ];

  return (
    <>
      <SEOHead 
        title="Pricing Plans - AI Financial Accountability"
        description="Choose the perfect plan for your financial journey. Bank-level security, AI insights, and 30-day money-back guarantee."
        keywords="pricing, financial app, budget tracker, AI insights, subscription plans"
      />
      
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <Badge className="mb-4">30-Day Money Back Guarantee</Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Choose Your
              <span className="block text-gradient">Financial Journey</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Start taking control of your finances today. No hidden fees, cancel anytime, 
              and get your first month back if you're not completely satisfied.
            </p>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="px-4 pb-16 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {PRICING_PLANS.filter(plan => plan.id === 'basic' || plan.id === 'pro').map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  onSelect={handleSelectPlan}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-4 py-16 sm:px-6 lg:px-8 bg-muted/30">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Why Choose Our Platform?</h2>
              <p className="text-lg text-muted-foreground">
                Built with security, simplicity, and success in mind
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card key={index} className="text-center">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">What Our Users Say</h2>
              <p className="text-lg text-muted-foreground">
                Real stories from people who transformed their finances
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <blockquote className="text-muted-foreground mb-4">
                      "{testimonial.content}"
                    </blockquote>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="px-4 py-16 sm:px-6 lg:px-8 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            </div>
            
            <div className="space-y-6">
              {[
                {
                  question: 'Can I cancel my subscription anytime?',
                  answer: 'Yes, you can cancel your subscription at any time from your account settings. There are no cancellation fees or hidden charges.'
                },
                {
                  question: 'Is my financial data secure?',
                  answer: 'Absolutely. We use bank-level 256-bit SSL encryption and maintain read-only access to your accounts. We never store your banking credentials.'
                },
                {
                  question: 'What banks do you support?',
                  answer: 'We support over 10,000 banks and credit unions across the US, including all major institutions like Chase, Bank of America, Wells Fargo, and more.'
                },
                {
                  question: 'Do you offer refunds?',
                  answer: 'Yes, we offer a 30-day money-back guarantee. If you\'re not satisfied with our service, contact us for a full refund.'
                }
              ].map((faq, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-2">{faq.question}</h3>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Your Financial Journey?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of users who have taken control of their finances
            </p>
            <Button 
              size="lg" 
              onClick={() => handleSelectPlan(PRICING_PLANS[1])} // Pro plan
              className="h-12 px-8"
            >
              Start with Pro Plan
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}