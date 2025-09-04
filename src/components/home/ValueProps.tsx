import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Shield, Zap, Users, TrendingUp, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const valueProps = [
  {
    icon: Brain,
    title: "AI-Powered Insights",
    description: "Get personalized financial recommendations and spending patterns analysis powered by advanced AI.",
    badge: "Most Popular",
    badgeVariant: "default" as const,
    benefits: ["Smart categorization", "Predictive analytics", "Custom recommendations"]
  },
  {
    icon: Shield,
    title: "Bank-Level Security",
    description: "Your data is protected with industry-leading encryption and security protocols.",
    badge: "Enterprise Ready",
    badgeVariant: "secondary" as const,
    benefits: ["256-bit encryption", "SOC 2 compliant", "Zero data sharing"]
  },
  {
    icon: Zap,
    title: "Automated Everything",
    description: "Set it and forget it. Automatic categorization, bill tracking, and budget adjustments.",
    badge: "Time Saver",
    badgeVariant: "outline" as const,
    benefits: ["Auto-categorization", "Bill reminders", "Smart budgets"]
  },
  {
    icon: Users,
    title: "Family Friendly",
    description: "Share budgets, track family expenses, and teach financial literacy together.",
    badge: "Family Plan",
    badgeVariant: "secondary" as const,
    benefits: ["Shared budgets", "Multiple accounts", "Kid-friendly features"]
  },
  {
    icon: TrendingUp,
    title: "Growth Tracking",
    description: "Visualize your financial progress with beautiful charts and achievement milestones.",
    badge: "Analytics Pro",
    badgeVariant: "outline" as const,
    benefits: ["Progress visualization", "Goal tracking", "Achievement system"]
  },
  {
    icon: Clock,
    title: "Real-Time Sync",
    description: "Instant updates across all your devices with automatic bank synchronization.",
    badge: "Live Updates",
    badgeVariant: "default" as const,
    benefits: ["Instant sync", "Multi-device", "Real-time alerts"]
  }
];

export const ValueProps: React.FC = () => {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-2">
            Why Choose Pocket Banker
          </Badge>
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
            Everything you need to
            <span className="text-gradient block mt-2">master your money</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Combining cutting-edge AI with intuitive design to deliver the most powerful financial management experience
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {valueProps.map((prop, index) => {
            const Icon = prop.icon;
            return (
              <Card 
                key={index} 
                className={cn(
                  "card-hover-lift bg-card/50 backdrop-blur-sm border-border/50 h-full",
                  "hover:border-primary/20 transition-all duration-300"
                )}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                      <Icon className="w-6 h-6" />
                    </div>
                    <Badge variant={prop.badgeVariant} className="text-xs">
                      {prop.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-semibold">
                    {prop.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {prop.description}
                  </p>
                  <ul className="space-y-2">
                    {prop.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-center text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-4">
            Ready to experience the difference?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Badge variant="secondary" className="px-4 py-2">
              <TrendingUp className="w-4 h-4 mr-2" />
              30% average savings increase
            </Badge>
            <Badge variant="secondary" className="px-4 py-2">
              <Users className="w-4 h-4 mr-2" />
              10,000+ happy families
            </Badge>
          </div>
        </div>
      </div>
    </section>
  );
};