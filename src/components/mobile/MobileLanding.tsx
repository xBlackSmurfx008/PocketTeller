import React, { useState } from "react";
import { useDemo } from "@/hooks/useDemo";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/utils/logger";
import { MobileHeader } from "./MobileHeader";
import { MobileHero } from "./MobileHero";
import { MobileFeatures } from "./MobileFeatures";
import { MobileSocialProof } from "./MobileSocialProof";
import { MobileCTA } from "./MobileCTA";
import PublicFooter from "@/components/PublicFooter";

export const MobileLanding: React.FC = () => {
  const { toast } = useToast();
  const { startDemo } = useDemo();
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
          source: 'mobile_landing',
          user_agent: navigator.userAgent
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        toast({
          title: "Connection Error",
          description: "Please check your connection and try again.",
          variant: "destructive"
        });
        return;
      }

      if (!data || !data.success) {
        const errorMessage = data?.error || "Unknown error occurred";
        
        if (errorMessage === 'Email already on waitlist') {
          toast({
            title: "Already Signed Up",
            description: "You're already on our waitlist! We'll notify you when ready.",
            variant: "default"
          });
        } else if (errorMessage === 'Rate limit exceeded') {
          toast({
            title: "Too Many Attempts",
            description: "Please wait before trying again.",
            variant: "destructive"
          });
        } else if (errorMessage === 'Invalid email format') {
          toast({
            title: "Invalid Email",
            description: "Please enter a valid email address.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Signup Failed",
            description: errorMessage,
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

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      
      <main className="overflow-x-hidden">
        <MobileHero onGetStarted={handleGetStarted} onTryDemo={handleTryDemo} />
        <MobileFeatures />
        <MobileSocialProof />
        <MobileCTA onGetStarted={handleGetStarted} onTryDemo={handleTryDemo} />
      </main>

      <PublicFooter />

      {/* Waitlist Form Modal */}
      {showWaitlistForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="font-semibold text-lg mb-2">Join the Waitlist</h3>
            <p className="text-muted-foreground mb-4 text-sm">
              Be the first to experience the future of financial management
            </p>
            <form onSubmit={handleWaitlistSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                className="h-12"
              />
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-1 h-12"
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
                  className="h-12 px-4"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};