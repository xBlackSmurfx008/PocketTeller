import React from "react";
import { Star } from "lucide-react";

const testimonials = [
  {
    quote: "Finally, an app that actually helps me save money!",
    name: "Sarah M.",
    role: "Teacher",
    rating: 5,
  },
  {
    quote: "The AI insights are incredibly accurate and helpful.",
    name: "Mike R.",
    role: "Engineer",
    rating: 5,
  },
  {
    quote: "Saved $3,000 in my first 6 months using this app.",
    name: "Jessica L.",
    role: "Designer",
    rating: 5,
  },
];

export const MobileSocialProof: React.FC = () => {
  return (
    <section className="py-16 px-4">
      <div className="text-center mb-12">
        <h2 className="text-2xl font-bold mb-2">
          Loved by thousands
        </h2>
        <p className="text-muted-foreground text-sm">
          Join 25,000+ users who've transformed their finances
        </p>
      </div>

      <div className="space-y-6 max-w-sm mx-auto">
        {testimonials.map((testimonial, index) => (
          <div 
            key={index}
            className="bg-background/60 backdrop-blur-sm border border-border/50 rounded-lg p-4 space-y-3"
          >
            {/* Stars */}
            <div className="flex space-x-1">
              {Array.from({ length: testimonial.rating }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-warning text-warning" />
              ))}
            </div>
            
            {/* Quote */}
            <p className="text-sm text-foreground leading-relaxed">
              "{testimonial.quote}"
            </p>
            
            {/* Author */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">
                  {testimonial.name.charAt(0)}
                </span>
              </div>
              <div>
                <div className="text-xs font-medium">{testimonial.name}</div>
                <div className="text-xs text-muted-foreground">{testimonial.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Trust metrics */}
      <div className="mt-12 text-center space-y-6">
        <div className="flex justify-center space-x-8">
          <div className="text-center">
            <div className="text-lg font-bold text-primary">4.9/5</div>
            <div className="text-xs text-muted-foreground">App Store</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-primary">25K+</div>
            <div className="text-xs text-muted-foreground">Happy Users</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-primary">$2M+</div>
            <div className="text-xs text-muted-foreground">Money Saved</div>
          </div>
        </div>
      </div>
    </section>
  );
};