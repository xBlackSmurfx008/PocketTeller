import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, TrendingUp, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeroProps {
  onGetStarted: () => void;
  onTryDemo: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onGetStarted, onTryDemo }) => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/3 rounded-full blur-3xl animate-pulse-soft" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Announcement Badge */}
          <div className="mb-8 animate-fade-in">
            <Badge variant="secondary" className="px-4 py-2 text-sm font-medium bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
              <Sparkles className="w-4 h-4 mr-2" />
              New: AI-Powered Financial Insights
            </Badge>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight mb-6 animate-slide-up">
            <span className="text-gradient">Smart Finance</span>
            <br />
            <span className="text-foreground">Simplified</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Transform your financial life with AI-powered insights, automated budgeting, and intelligent expense tracking. 
            Join thousands taking control of their money.
          </p>

          {/* Value Props */}
          <div className="flex flex-wrap justify-center gap-6 mb-10 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <div className="flex items-center text-muted-foreground">
              <TrendingUp className="w-5 h-5 mr-2 text-success" />
              <span>Average 30% savings increase</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <Shield className="w-5 h-5 mr-2 text-primary" />
              <span>Bank-level security</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-scale-in" style={{ animationDelay: "0.6s" }}>
            <Button 
              size="lg" 
              className="px-8 py-4 text-lg font-semibold btn-magnetic ripple-effect bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={onGetStarted}
            >
              Start Free Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 py-4 text-lg font-semibold border-2 hover:bg-muted/50"
              onClick={onTryDemo}
            >
              Try Live Demo
            </Button>
          </div>

          {/* Social Proof */}
          <div className="mt-12 pt-8 border-t border-border/50 animate-fade-in" style={{ animationDelay: "0.8s" }}>
            <p className="text-sm text-muted-foreground mb-4">Trusted by leading organizations</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              {/* Placeholder for logos - would be replaced with actual partner logos */}
              <div className="text-2xl font-bold text-muted-foreground/50">TechCorp</div>
              <div className="text-2xl font-bold text-muted-foreground/50">FinanceInc</div>
              <div className="text-2xl font-bold text-muted-foreground/50">StartupCo</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-muted-foreground/50 rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
};