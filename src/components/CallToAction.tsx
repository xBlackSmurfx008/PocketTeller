import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const trustedBrands = [
  'Linear', 'Notion', 'Vercel', 'Stripe', 'GitHub', 'Figma'
];

const CallToAction = () => {
  return (
    <section className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        {/* CTA Band */}
        <div className="relative gradient-cta rounded-3xl p-16 text-center overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)] pointer-events-none" />
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-6 text-white">
              Ready to transform your finances?
            </h2>
            
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
              Join thousands of users who have taken control of their financial future with Pocket Banker's intelligent tools and insights.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-3 bg-white text-purple-900 hover:bg-white/90">
                Start for free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-3 border-white/30 text-white hover:bg-white/10">
                Talk to sales
              </Button>
            </div>
            
            {/* Trust row */}
            <div className="border-t border-white/20 pt-8">
              <p className="text-white/70 text-sm mb-6">Trusted by teams at</p>
              <div className="flex flex-wrap justify-center items-center gap-8 opacity-70">
                {trustedBrands.map((brand) => (
                  <div key={brand} className="text-white font-medium">
                    {brand}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;