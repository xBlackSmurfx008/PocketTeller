import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/hooks/useDemo";
import { useToast } from "@/hooks/use-toast";
import Dashboard from "@/components/Dashboard";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { Hero, ValueProps, SocialProof, FinalCTA } from "@/components/home";
import TrustedByMarquee from "@/components/TrustedByMarquee";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { HomeSEO } from "@/components/SEOHead";
import { logger } from "@/utils/logger";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { isDemo, startDemo } = useDemo();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWaitlistForm, setShowWaitlistForm] = useState(false);

  const handleGetStarted = () => {
    setShowWaitlistForm(true);
  };

  const handleTryDemo = () => {
    startDemo();
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address.",
        variant: "destructive"
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Use secure waitlist signup endpoint
      const { data, error } = await supabase.functions.invoke('secure-waitlist-signup', {
        body: { 
          email: email.trim(),
          source: 'home_hero',
          user_agent: navigator.userAgent
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to process signup');
      }

      if (!data.success) {
        if (data.error === 'Email already on waitlist') {
          toast({
            title: "Already Signed Up",
            description: "You're already on our waitlist! We'll notify you when ready.",
            variant: "default"
          });
        } else if (data.error === 'Rate limit exceeded') {
          toast({
            title: "Too Many Attempts",
            description: "Please wait before trying again.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Signup Failed",
            description: data.error || "Please try again.",
            variant: "destructive"
          });
        }
        return;
      }

      // Send confirmation email
      const { error: functionError } = await supabase.functions.invoke('send-waitlist-confirmation', {
        body: { email: email.trim() }
      });

      if (functionError) {
        logger.warn('Waitlist confirmation email failed', {
          error: functionError.message,
          email: email.trim()
        });
      }

      toast({
        title: "Welcome to the Waitlist!",
        description: "Thanks for signing up! Check your email for confirmation.",
        variant: "default"
      });
      
      setEmail("");
      setShowWaitlistForm(false);
      
    } catch (error) {
      logger.error('Waitlist signup failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        email: email.trim()
      });
      
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Authenticated users see dashboard
  if (user && !isDemo) {
    return (
      <>
        <HomeSEO />
        <Dashboard />
      </>
    );
  }

  return (
    <>
      <HomeSEO />
      <div className="min-h-screen bg-background">
      <PublicHeader />
      
      <main>
        <Hero onGetStarted={handleGetStarted} onTryDemo={handleTryDemo} />
        
        <TrustedByMarquee />
        
        <ValueProps />
        
        <SocialProof />
        
        <FinalCTA onGetStarted={handleGetStarted} onTryDemo={handleTryDemo} />

        {/* Waitlist Form Modal */}
        {showWaitlistForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-background border rounded-lg p-6 max-w-md w-full">
              <h3 className="font-semibold text-lg mb-2">Join the Waitlist</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to experience the future of financial management
              </p>
              <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Joining...
                      </>
                    ) : (
                      'Join Waitlist'
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setShowWaitlistForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

        <PublicFooter />
      </div>
    </>
  );
};

export default Index;