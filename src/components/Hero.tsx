import { ArrowRight, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroMockup from '@/assets/hero-mockup.jpg';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 pt-16 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-background to-blue-900/20" />
      
      <div className="relative z-10 max-w-7xl mx-auto text-center">
        <div className="max-w-5xl mx-auto">
          {/* Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-6">
            Pocket Banker is a{' '}
            <span className="gradient-text">
              purpose-built tool
            </span>
            <br />
            for modern finance management
          </h1>
          
          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            Meet the system for modern financial planning. Streamline budgets, expenses, and financial goals with AI-powered insights and bank integrations.
          </p>
          
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" className="text-lg px-8 py-3 gradient-primary hover-glow">
              Get started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-3">
              <Play className="mr-2 h-5 w-5" />
              Watch demo
            </Button>
          </div>
        </div>
        
        {/* Hero mockup */}
        <div className="relative max-w-6xl mx-auto">
          {/* Glow effect behind mockup */}
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/30 to-blue-600/30 blur-3xl rounded-3xl" />
          
          {/* Mockup card */}
          <div className="relative glass rounded-2xl p-8 shadow-2xl animate-fade-in">
            <img
              src={heroMockup}
              alt="Modern financial dashboard interface showing charts, budgets, and AI insights in a clean dark theme design"
              className="w-full h-auto rounded-xl border border-border/50"
              loading="lazy"
              decoding="async"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;