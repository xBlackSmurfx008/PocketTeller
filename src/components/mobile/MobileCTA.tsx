import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock, Shield, TrendingUp } from "lucide-react";

interface MobileCTAProps {
  onGetStarted: () => void;
  onTryDemo: () => void;
  onGoPro?: () => void;
}

export const MobileCTA: React.FC<MobileCTAProps> = ({
  onGetStarted,
  onTryDemo,
  onGoPro,
}) => {
  return (
    <section className="py-16 px-4 bg-gradient-to-t from-muted/50 to-background">
      <div className="max-w-sm mx-auto text-center space-y-8">
        {/* Badge */}
        <Badge variant="secondary" className="px-3 py-1 text-xs">
          <Clock className="w-3 h-3 mr-1" />
          Limited Time: Free Forever
        </Badge>

        {/* Headline */}
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">
            Ready to take
            <span className="block text-primary">control of your money?</span>
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Join thousands who've already transformed their financial future with AI
          </p>
        </div>

        {/* Value props */}
        <div className="space-y-3 text-left">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-success/20 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-success rounded-full"></div>
            </div>
            <span className="text-sm">Free forever - no credit card required</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-success/20 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-success rounded-full"></div>
            </div>
            <span className="text-sm">Setup takes less than 2 minutes</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-success/20 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-success rounded-full"></div>
            </div>
            <span className="text-sm">Bank-level security & encryption</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={onGetStarted}
            size="lg" 
            className="w-full h-12 text-base font-semibold btn-magnetic"
          >
            Start Your Journey
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          {onGoPro && (
            <Button 
              onClick={onGoPro}
              variant="secondary"
              size="lg"
              className="w-full h-12 text-base"
            >
              Go Pro
              <TrendingUp className="w-5 h-5 ml-2" />
            </Button>
          )}
          <Button 
            onClick={onTryDemo}
            variant="outline" 
            size="lg"
            className="w-full h-12 text-base"
          >
            Watch 2-Min Demo
          </Button>
        </div>

        {/* Risk-free guarantee */}
        <div className="pt-4 text-center">
          <div className="inline-flex items-center space-x-2 text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-full">
            <Shield className="w-3 h-3" />
            <span>Risk-free • Cancel anytime</span>
          </div>
        </div>

        {/* Final stats */}
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border/50">
          <div className="text-center">
            <div className="text-sm font-semibold text-primary">25,000+</div>
            <div className="text-xs text-muted-foreground">Active Users</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-primary">$2.1M+</div>
            <div className="text-xs text-muted-foreground">Total Savings</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-primary">4.9/5</div>
            <div className="text-xs text-muted-foreground">User Rating</div>
          </div>
        </div>
      </div>
    </section>
  );
};