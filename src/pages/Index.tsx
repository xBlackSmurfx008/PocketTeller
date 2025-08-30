import { lazy, Suspense, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDemo } from '@/hooks/useDemo';
import { useReveal } from '@/hooks/useReveal';
import { useSiteMetrics } from '@/hooks/useSiteMetrics';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, Landmark, BarChart3, CreditCard, Target, CalendarCheck2 } from 'lucide-react';

const Dashboard = lazy(() => import('@/components/Dashboard'));
import TrustedByMarquee from '@/components/TrustedByMarquee';
import CountUp from '@/components/CountUp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PublicFooter from '@/components/PublicFooter';


const Index = () => {
  const { user, loading } = useAuth();
  const { isDemo } = useDemo();
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [joined, setJoined] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const { toast } = useToast();
  
  // Animation hooks
  const featuresReveal = useReveal();
  const ctaReveal = useReveal();
  const kpiReveal = useReveal();
  const { metrics } = useSiteMetrics();

  // Scroll-driven animations
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Countdown to October 16th
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      let launchDate = new Date(currentYear, 9, 16); // October 16th (month is 0-indexed)
      
      // If we've passed Oct 16 this year, use next year
      if (now > launchDate) {
        launchDate = new Date(currentYear + 1, 9, 16);
      }
      
      const difference = launchDate.getTime() - now.getTime();
      
      if (difference <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setCountdown({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('waitlist_signups')
        .insert({
          email: email.trim().toLowerCase(), // Normalize email
          source: 'home_hero',
          user_agent: navigator.userAgent
        });

      if (error) {
        if (error.code === '23505') { // Unique violation
          toast({
            title: "Already signed up!",
            description: "You're already on the list with that email.",
          });
        } else {
          toast({
            title: "Error",
            description: "Something went wrong. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        // Database insertion successful, now send confirmation email
        setJoined(true);
        
        try {
          // Send confirmation email
          const { error: emailError } = await supabase.functions.invoke('send-waitlist-confirmation', {
            body: {
              email: email.trim(),
              source: 'home_hero',
              user_agent: navigator.userAgent
            }
          });

          if (emailError) {
            console.error('Email confirmation failed:', emailError);
            toast({
              title: "You're on the waitlist!",
              description: "Confirmation email failed to send, but you're registered for Oct 16.",
            });
          } else {
            toast({
              title: "Welcome to the waitlist!",
              description: "Check your email for confirmation. We'll be in touch before Oct 16!",
            });
          }
        } catch (emailError) {
          console.error('Email confirmation error:', emailError);
          toast({
            title: "You're on the waitlist!",
            description: "Confirmation email failed to send, but you're registered for Oct 16.",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };
  


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="text-xl text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (user || isDemo) {
    return (
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <div className="text-xl text-muted-foreground">Loading...</div>
          </div>
        </div>
      }>
        <Dashboard />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-background scroll-smooth">
      {/* Navigation Header */}
      <header className="absolute top-0 left-0 right-0 z-20 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="font-semibold text-lg">Pocket Banker</div>
          <nav className="flex items-center gap-6">
            <Button variant="ghost" size="sm" onClick={() => navigate('/for-institutions')}>
              For Institutions
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/auth')} aria-label="Sign in">
              Sign In
            </Button>
          </nav>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 px-4 aurora-bg content-visible">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 pointer-events-none -z-10" />
        
        <div 
          className="relative z-10 max-w-6xl mx-auto text-center parallax-subtle"
          style={{ '--scroll-y': `${scrollY * 0.1}px` } as React.CSSProperties}
        >
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-gradient">
            Smart AI-Powered Finance Management
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto scroll-reveal in-view">
            Take control of your finances with intelligent budgeting, expense tracking, and personalized AI insights. 
            Connect your bank accounts and let AI help you make smarter financial decisions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/auth')} 
              size="lg"
              className="text-lg px-8 py-3 h-auto btn-shimmer btn-magnetic ripple-effect"
            >
              Get Started Free
            </Button>
            <Button 
              onClick={() => navigate('/demo')} 
              variant="outline"
              size="lg"
              className="text-lg px-8 py-3 h-auto btn-magnetic"
            >
              Try Demo
            </Button>
          </div>

          {/* Waitlist Signup */}
          <div className="max-w-md mx-auto mt-8">
            {!joined ? (
              <form onSubmit={handleWaitlistSubmit} className="flex gap-3 items-center justify-center">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  required
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  disabled={submitting || !email.trim()}
                  className="whitespace-nowrap"
                >
                  {submitting ? "Joining..." : "Join Waitlist"}
                </Button>
              </form>
            ) : (
              <div className="text-center">
                <p className="text-success font-medium">You're on the list! We'll be in touch before Oct 16.</p>
              </div>
            )}
            
            {/* Countdown */}
            <div className="text-center mt-4">
              {countdown.days === 0 && countdown.hours === 0 && countdown.minutes === 0 && countdown.seconds === 0 ? (
                <p className="text-lg font-semibold text-primary">Launching today! 🚀</p>
              ) : (
                <p className="text-muted-foreground">
                  Launching in <span className="font-mono font-semibold text-foreground">
                    {countdown.days}d {countdown.hours.toString().padStart(2, '0')}:
                    {countdown.minutes.toString().padStart(2, '0')}:
                    {countdown.seconds.toString().padStart(2, '0')}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Section */}
      <TrustedByMarquee />
      
      {/* KPI Section */}
      <section className="py-12 px-4 bg-muted/20 content-visible">
        <div 
          ref={kpiReveal.ref}
          className={`max-w-4xl mx-auto grid-modern reveal scale-on-scroll ${kpiReveal.isVisible ? 'is-visible in-view' : ''}`}
        >
          <div className="kpi-stat card-hover-lift">
            <span className="kpi-number">
              <CountUp end={metrics.totalUsers} suffix={metrics.totalUsers > 0 ? "+" : undefined} animateOnChange={false} />
            </span>
            <span className="kpi-label">Users Joined</span>
          </div>
          <div className="kpi-stat card-hover-lift">
            <span className="kpi-number">
              <CountUp end={metrics.totalBudgets} suffix={metrics.totalBudgets > 0 ? "+" : undefined} animateOnChange={false} />
            </span>
            <span className="kpi-label">Budgets Created</span>
          </div>
          <div className="kpi-stat card-hover-lift">
            <span className="kpi-number">
              <CountUp end={metrics.totalTransactions} suffix={metrics.totalTransactions > 0 ? "+" : undefined} animateOnChange={false} />
            </span>
            <span className="kpi-label">Transactions Tracked</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30 content-visible">
        <div className="max-w-6xl mx-auto">
          <h2 
            ref={featuresReveal.ref}
            className={`text-3xl md:text-4xl font-bold text-center mb-12 text-foreground reveal ${featuresReveal.isVisible ? 'is-visible' : ''}`}
          >
            Everything you need to manage your finances
          </h2>
          <div className="grid-modern">
            <Card className={`text-center p-6 card-hover-lift scroll-reveal ${featuresReveal.isVisible ? 'in-view' : ''}`}>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">AI Financial Assistant</h3>
              <p className="text-muted-foreground">
                Get personalized insights, spending recommendations, and financial advice powered by advanced AI
              </p>
            </Card>
            
            <Card className={`text-center p-6 card-hover-lift scroll-reveal reveal-delay-1 ${featuresReveal.isVisible ? 'in-view' : ''}`}>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Landmark className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Bank Integration</h3>
              <p className="text-muted-foreground">
                Securely connect your bank accounts to automatically track transactions and account balances
              </p>
            </Card>
            
            <Card className={`text-center p-6 card-hover-lift scroll-reveal reveal-delay-2 ${featuresReveal.isVisible ? 'in-view' : ''}`}>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Smart Analytics</h3>
              <p className="text-muted-foreground">
                Visualize your spending patterns, track goals, and get actionable insights about your financial health
              </p>
            </Card>
            
            <Card className={`text-center p-6 card-hover-lift scroll-reveal ${featuresReveal.isVisible ? 'in-view' : ''}`}>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Transaction Tracking</h3>
              <p className="text-muted-foreground">
                Automatically categorize expenses, search transactions, and understand where your money goes
              </p>
            </Card>
            
            <Card className={`text-center p-6 card-hover-lift scroll-reveal reveal-delay-1 ${featuresReveal.isVisible ? 'in-view' : ''}`}>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Goal Setting</h3>
              <p className="text-muted-foreground">
                Set financial goals, track progress, and get AI-powered recommendations to achieve them faster
              </p>
            </Card>
            
            <Card className={`text-center p-6 card-hover-lift scroll-reveal reveal-delay-2 ${featuresReveal.isVisible ? 'in-view' : ''}`}>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <CalendarCheck2 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Bill Management</h3>
              <p className="text-muted-foreground">
                Never miss a payment with smart bill tracking, reminders, and automated payment scheduling
              </p>
            </Card>
          </div>
        </div>
      </section>


      {/* CTA Section */}
      <section className="py-20 px-4 content-visible">
        <div className="max-w-4xl mx-auto text-center">
          <h2 
            ref={ctaReveal.ref}
            className={`text-3xl md:text-4xl font-bold mb-6 text-gradient reveal ${ctaReveal.isVisible ? 'is-visible' : ''}`}
          >
            Ready to take control of your finances?
          </h2>
          <p className={`text-xl text-muted-foreground mb-8 scroll-reveal reveal-delay-1 ${ctaReveal.isVisible ? 'in-view' : ''}`}>
            Join thousands of users who have transformed their financial lives with Pocket Banker.
          </p>
          <div className={`flex flex-col sm:flex-row gap-4 justify-center scroll-reveal reveal-delay-2 ${ctaReveal.isVisible ? 'in-view' : ''}`}>
            <Button 
              onClick={() => navigate('/auth')} 
              size="lg"
              className="text-lg px-8 py-3 h-auto btn-shimmer btn-magnetic ripple-effect"
            >
              Start Your Financial Journey
            </Button>
            <Button 
              onClick={() => navigate('/demo')} 
              variant="outline"
              size="lg"
              className="text-lg px-8 py-3 h-auto btn-magnetic"
            >
              Explore Demo First
            </Button>
          </div>
        </div>
      </section>
      
      <PublicFooter />
    </div>
  );
};

export default Index;
