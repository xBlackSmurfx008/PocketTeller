import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, Shield, Target } from "lucide-react";

const features = [
  {
    icon: <Brain className="w-8 h-8 text-primary" />,
    title: "AI Financial Coach",
    description: "Get personalized advice from your AI money coach that learns your spending habits",
    badge: "Smart",
  },
  {
    icon: <TrendingUp className="w-8 h-8 text-success" />,
    title: "Smart Insights",
    description: "Discover hidden spending patterns and opportunities to save more money",
    badge: "Popular",
  },
  {
    icon: <Target className="w-8 h-8 text-warning" />,
    title: "Goal Tracking",
    description: "Set and achieve financial goals with automated progress tracking",
    badge: "Essential",
  },
  {
    icon: <Shield className="w-8 h-8 text-info" />,
    title: "Bank Security",
    description: "Your data is protected with bank-level security and encryption",
    badge: "Secure",
  },
];

export const MobileFeatures: React.FC = () => {
  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold mb-4">
          Everything you need to
          <span className="block text-primary">master your money</span>
        </h2>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Powerful features designed to make financial management effortless
        </p>
      </div>

      <div className="space-y-4 max-w-sm mx-auto">
        {features.map((feature, index) => (
          <Card 
            key={index} 
            className="p-6 bg-background/80 backdrop-blur-sm border border-border/50 hover:border-primary/20 transition-all duration-300"
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
                {feature.icon}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-base">{feature.title}</h3>
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {feature.badge}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};