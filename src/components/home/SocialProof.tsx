import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Quote, TrendingUp, Users, DollarSign } from "lucide-react";
import CountUp from "@/components/CountUp";

const testimonials = [
  {
    quote: "Pocket Banker transformed how our family manages money. The AI insights helped us save $500 monthly without changing our lifestyle.",
    author: "Sarah Chen",
    role: "Marketing Manager",
    company: "TechCorp",
    avatar: "SC",
    rating: 5,
    savings: "$6,000",
    metric: "saved annually"
  },
  {
    quote: "As a financial advisor, I recommend Pocket Banker to all my clients. The automated categorization and real-time insights are game-changing.",
    author: "Michael Rodriguez",
    role: "Financial Advisor",
    company: "WealthWise",
    avatar: "MR",
    rating: 5,
    savings: "40%",
    metric: "time saved on budgeting"
  },
  {
    quote: "The family features are incredible. My kids are learning about money while we track our family budget together. Education and management in one app.",
    author: "Jennifer Park",
    role: "Education Director",
    company: "Learning Hub",
    avatar: "JP",
    rating: 5,
    savings: "3x",
    metric: "better financial literacy"
  }
];

const metrics = [
  {
    icon: Users,
    value: 15000,
    suffix: "+",
    label: "Active Families",
    description: "Managing their finances smarter"
  },
  {
    icon: DollarSign,
    value: 12.8,
    suffix: "M",
    label: "Total Savings",
    description: "Generated for our users"
  },
  {
    icon: TrendingUp,
    value: 89,
    suffix: "%",
    label: "Success Rate",
    description: "Users meet their financial goals"
  }
];

export const SocialProof: React.FC = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        {/* Metrics Section */}
        <div className="text-center mb-24">
          <Badge variant="outline" className="mb-6 px-6 py-3">
            Trusted by Thousands
          </Badge>
          <h2 className="typography-hero font-display font-bold mb-8">
            Real results from
            <span className="text-gradient block mt-2">real families</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-16">
            {metrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <div key={index} className="text-center p-8 rounded-2xl bg-card/50 border border-border/50 hover:bg-card transition-all duration-300 hover:scale-105">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 text-primary mb-6">
                    <Icon className="w-10 h-10" />
                  </div>
                  <div className="text-4xl lg:text-5xl font-display font-bold text-foreground mb-4">
                    <CountUp end={metric.value} duration={2000} />
                    {metric.suffix}
                  </div>
                  <div className="typography-body-lg font-semibold text-foreground mb-2">
                    {metric.label}
                  </div>
                  <div className="typography-body text-muted-foreground">
                    {metric.description}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="mb-16">
          <h3 className="text-3xl font-display font-bold text-center mb-12">
            What our users say
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="card-hover-lift bg-card/50 backdrop-blur-sm border-border/50 h-full">
                <CardContent className="p-6">
                  {/* Rating */}
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>

                  {/* Quote */}
                  <div className="relative mb-6">
                    <Quote className="absolute -top-2 -left-2 w-6 h-6 text-primary/20" />
                    <p className="text-muted-foreground leading-relaxed pl-4">
                      {testimonial.quote}
                    </p>
                  </div>

                  {/* Author */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm mr-3">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">
                          {testimonial.author}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {testimonial.role}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Metric */}
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <div className="text-center">
                      <div className="text-2xl font-display font-bold text-success">
                        {testimonial.savings}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {testimonial.metric}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-6">
            Secured and trusted by industry leaders
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <Badge variant="outline" className="px-4 py-2">
              SOC 2 Certified
            </Badge>
            <Badge variant="outline" className="px-4 py-2">
              256-bit Encryption
            </Badge>
            <Badge variant="outline" className="px-4 py-2">
              GDPR Compliant
            </Badge>
            <Badge variant="outline" className="px-4 py-2">
              Zero Data Sharing
            </Badge>
          </div>
        </div>
      </div>
    </section>
  );
};