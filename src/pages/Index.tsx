import { lazy, Suspense, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDemo } from '@/hooks/useDemo';
import { useReveal } from '@/hooks/useReveal';
import { useSiteMetrics } from '@/hooks/useSiteMetrics';

const Dashboard = lazy(() => import('@/components/Dashboard'));
import TrustedByMarquee from '@/components/TrustedByMarquee';
import CountUp from '@/components/CountUp';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PublicFooter from '@/components/PublicFooter';


const Index = () => {
  const { user, loading } = useAuth();
  const { isDemo } = useDemo();
  const navigate = useNavigate();
  const [scrollY, setScrollY] = useState(0);
  
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
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4 aurora-bg content-visible">
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
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-foreground">AI Financial Assistant</h3>
              <p className="text-muted-foreground">
                Get personalized insights, spending recommendations, and financial advice powered by advanced AI
              </p>
            </Card>
            
            <Card className={`text-center p-6 card-hover-lift scroll-reveal reveal-delay-1 ${featuresReveal.isVisible ? 'in-view' : ''}`}>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏦</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Bank Integration</h3>
              <p className="text-muted-foreground">
                Securely connect your bank accounts to automatically track transactions and account balances
              </p>
            </Card>
            
            <Card className={`text-center p-6 card-hover-lift scroll-reveal reveal-delay-2 ${featuresReveal.isVisible ? 'in-view' : ''}`}>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Smart Analytics</h3>
              <p className="text-muted-foreground">
                Visualize your spending patterns, track goals, and get actionable insights about your financial health
              </p>
            </Card>
            
            <Card className={`text-center p-6 card-hover-lift scroll-reveal ${featuresReveal.isVisible ? 'in-view' : ''}`}>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💳</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Transaction Tracking</h3>
              <p className="text-muted-foreground">
                Automatically categorize expenses, search transactions, and understand where your money goes
              </p>
            </Card>
            
            <Card className={`text-center p-6 card-hover-lift scroll-reveal reveal-delay-1 ${featuresReveal.isVisible ? 'in-view' : ''}`}>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Goal Setting</h3>
              <p className="text-muted-foreground">
                Set financial goals, track progress, and get AI-powered recommendations to achieve them faster
              </p>
            </Card>
            
            <Card className={`text-center p-6 card-hover-lift scroll-reveal reveal-delay-2 ${featuresReveal.isVisible ? 'in-view' : ''}`}>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📅</span>
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
            Join thousands of users who have transformed their financial lives with Budget AI.
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
