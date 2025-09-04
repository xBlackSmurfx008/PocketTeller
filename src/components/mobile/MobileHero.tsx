import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles } from "lucide-react";

interface MobileHeroProps {
  onGetStarted: () => void;
  onTryDemo: () => void;
}

export const MobileHero: React.FC<MobileHeroProps> = ({
  onGetStarted,
  onTryDemo,
}) => {
  return (
    <section className="relative min-h-screen flex flex-col justify-center px-4 pt-20 pb-16 bg-gradient-to-b from-background via-background/95 to-background/90">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/5 rounded-full blur-xl"></div>
        <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-accent/10 rounded-full blur-xl"></div>
      </div>

      <div className="relative z-10 text-center space-y-8">
        {/* Badge */}
        <div className="flex justify-center">
          <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
            <Sparkles className="w-4 h-4 mr-2" />
            #1 AI Financial Assistant
          </Badge>
        </div>

        {/* Main headline */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Your AI
            <span className="block text-gradient">Financial Accountability</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Get personalized financial insights and achieve your money goals with AI-powered guidance
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-xs mx-auto">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">25K+</div>
            <div className="text-xs text-muted-foreground">Users</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">$2M+</div>
            <div className="text-xs text-muted-foreground">Saved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">4.9★</div>
            <div className="text-xs text-muted-foreground">Rating</div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3 max-w-sm mx-auto">
          <Button 
            onClick={onGetStarted}
            size="lg" 
            className="w-full h-12 text-base font-semibold btn-shimmer"
          >
            Start Free Today
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button 
            onClick={onTryDemo}
            variant="outline" 
            size="lg"
            className="w-full h-12 text-base"
          >
            Try Live Demo
          </Button>
        </div>

        {/* Trust indicators */}
        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
            <span className="flex items-center">
              🔒 Bank-level security
            </span>
            <span className="flex items-center">
              📈 35% avg. savings increase
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};