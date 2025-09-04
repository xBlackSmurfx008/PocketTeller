import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, Sparkles, Timer } from "lucide-react";

interface FinalCTAProps {
  onGetStarted: () => void;
  onTryDemo: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onGetStarted, onTryDemo }) => {
  return (
    <section className="py-24 bg-gradient-to-br from-primary/5 via-background to-accent/5 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-40 h-40 bg-primary/10 rounded-full blur-2xl" />
        <div className="absolute bottom-10 right-10 w-60 h-60 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Urgency Badge */}
          <div className="mb-10">
            <Badge variant="secondary" className="px-6 py-3 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 transition-colors duration-300">
              <Timer className="w-4 h-4 mr-2" />
              Limited Time: Free Setup + First Month
            </Badge>
          </div>

          {/* Main Headline */}
          <h2 className="typography-hero font-display font-bold mb-8">
            Ready to transform your
            <span className="text-gradient block mt-2">financial future?</span>
          </h2>

          <p className="typography-subtitle text-muted-foreground max-w-3xl mx-auto mb-12">
            Join thousands of families already saving money and building wealth with AI-powered financial management.
          </p>

          {/* Value Props */}
          <div className="flex flex-wrap justify-center gap-6 mb-10 text-sm">
            <div className="flex items-center text-muted-foreground">
              <CheckCircle className="w-4 h-4 mr-2 text-success" />
              <span>Free forever plan</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <CheckCircle className="w-4 h-4 mr-2 text-success" />
              <span>Setup in under 5 minutes</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <CheckCircle className="w-4 h-4 mr-2 text-success" />
              <span>Cancel anytime</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
            <Button 
              size="lg" 
              className="px-12 py-5 text-lg font-semibold btn-shimmer btn-magnetic bg-primary hover:bg-primary/90 text-primary-foreground group rounded-xl"
              onClick={onGetStarted}
            >
              <Sparkles className="mr-2 h-5 w-5 group-hover:animate-spin" />
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-12 py-5 text-lg font-semibold border-2 hover:bg-muted/50 hover:scale-105 transition-all duration-300 rounded-xl"
              onClick={onTryDemo}
            >
              Watch 2-Min Demo
            </Button>
          </div>

          {/* Risk-free guarantee */}
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">✨ No credit card required • 🔒 Bank-level security • 📱 Works on all devices</p>
            <p>30-day money-back guarantee on premium features</p>
          </div>

          {/* Social proof numbers */}
          <div className="mt-16 pt-8 border-t border-border/50">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
              <div className="p-6 rounded-xl bg-card/50 border border-border/50 hover:bg-card transition-all duration-300 hover:scale-105">
                <div className="text-3xl lg:text-4xl font-display font-bold text-primary mb-2">15,000+</div>
                <div className="typography-body text-muted-foreground">Active Users</div>
              </div>
              <div className="p-6 rounded-xl bg-card/50 border border-border/50 hover:bg-card transition-all duration-300 hover:scale-105">
                <div className="text-3xl lg:text-4xl font-display font-bold text-success mb-2">$12.8M</div>
                <div className="typography-body text-muted-foreground">Total Savings</div>
              </div>
              <div className="p-6 rounded-xl bg-card/50 border border-border/50 hover:bg-card transition-all duration-300 hover:scale-105">
                <div className="text-3xl lg:text-4xl font-display font-bold text-accent mb-2">4.9★</div>
                <div className="typography-body text-muted-foreground">User Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};