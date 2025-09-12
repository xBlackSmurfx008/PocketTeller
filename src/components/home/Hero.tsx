import React from "react";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, TrendingUp, Shield, Users, DollarSign, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShadeButton } from "@/components/shade/ShadeButton";

interface HeroProps {
  onGetStarted: () => void;
  onTryDemo: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onGetStarted, onTryDemo }) => {
  return (
    <section className="relative min-h-[95vh] flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 hero-grid" />
        <div className="absolute inset-0 halo-aurora" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/8 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/8 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-pulse-soft" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Glass Container */}
          <div className="glass-container rounded-3xl p-12 md:p-16 text-center">
            {/* Announcement Badge */}
            <div className="mb-12 animate-fade-in">
              <Badge variant="secondary" className="px-8 py-4 text-base font-medium bg-primary/15 text-primary border-primary/30 hover:bg-primary/25 transition-all duration-300 hover:scale-105">
                <Sparkles className="w-5 h-5 mr-3" />
                New: AI-Powered Financial Insights
              </Badge>
            </div>

            {/* Main Headline */}
            <h1 className="typography-hero font-display font-bold leading-tight mb-10 animate-slide-up">
              <span className="text-gradient bg-gradient-to-r from-primary via-primary/90 to-accent bg-clip-text text-transparent">Smart Finance</span>
              <br />
              <span className="text-foreground">Simplified</span>
            </h1>

            {/* Subheadline */}
            <p className="typography-subtitle text-muted-foreground max-w-4xl mx-auto mb-14 animate-fade-in leading-relaxed" style={{ animationDelay: "0.2s" }}>
              Transform your financial life with AI-powered insights, automated budgeting, and intelligent expense tracking. 
              Join thousands taking control of their money.
            </p>

            {/* Credibility Strip */}
            <div className="flex flex-wrap justify-center gap-12 mb-16 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <div className="flex items-center text-muted-foreground group">
                <Users className="w-7 h-7 mr-4 text-primary group-hover:scale-110 transition-transform duration-300" />
                <div className="text-left">
                  <div className="typography-body-lg font-semibold text-foreground stat-counter">50K+</div>
                  <div className="text-sm">Users Waitlisted</div>
                </div>
              </div>
              <div className="flex items-center text-muted-foreground group">
                <DollarSign className="w-7 h-7 mr-4 text-success group-hover:scale-110 transition-transform duration-300" />
                <div className="text-left">
                  <div className="typography-body-lg font-semibold text-foreground stat-counter">$2.5M+</div>
                  <div className="text-sm">Money Saved</div>
                </div>
              </div>
              <div className="flex items-center text-muted-foreground group">
                <Star className="w-7 h-7 mr-4 text-accent group-hover:scale-110 transition-transform duration-300" />
                <div className="text-left">
                  <div className="typography-body-lg font-semibold text-foreground stat-counter">4.9/5</div>
                  <div className="text-sm">User Rating</div>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-scale-in" style={{ animationDelay: "0.5s" }}>
              <ShadeButton 
                intent="primary"
                size="lg" 
                className="px-14 py-6 text-xl font-semibold rounded-2xl group"
                onClick={onGetStarted}
              >
                JOIN WAITLIST
                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform duration-300" />
              </ShadeButton>
              <ShadeButton 
                intent="secondary"
                size="lg" 
                className="px-14 py-6 text-xl font-semibold rounded-2xl glass-container border-2"
                onClick={onTryDemo}
              >
                Try Live Demo
              </ShadeButton>
            </div>

            {/* Trust Indicators */}
            <div className="mt-14 pt-8 border-t border-border/30 animate-fade-in" style={{ animationDelay: "0.7s" }}>
              <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-primary" />
                  Bank-level security
                </div>
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 mr-2 text-success" />
                  30% average savings increase
                </div>
              </div>
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