import { lazy, Suspense } from 'react';
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
  
  // Animation hooks
  const heroReveal = useReveal();
  const featuresReveal = useReveal();
  const ctaReveal = useReveal();
  const kpiReveal = useReveal();
  const { metrics } = useSiteMetrics();
  


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
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4 aurora-bg">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
        
        <div className="relative max-w-6xl mx-auto text-center">
          <h1 
            ref={heroReveal.ref} 
            className={`text-4xl md:text-6xl font-bold tracking-tight mb-6 reveal ${heroReveal.isVisible ? 'is-visible' : ''}`}
          >
            Smart <span className="text-primary">AI-Powered</span> Finance Management
          </h1>
          <p className={`text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto reveal reveal-delay-1 ${heroReveal.isVisible ? 'is-visible' : ''}`}>
            Take control of your finances with intelligent budgeting, expense tracking, and personalized AI insights. 
            Connect your bank accounts and let AI help you make smarter financial decisions.
          </p>
          <div className={`flex flex-col sm:flex-row gap-4 justify-center reveal reveal-delay-2 ${heroReveal.isVisible ? 'is-visible' : ''}`}>
            <Button 
              onClick={() => navigate('/auth')} 
              size="lg"
              className="text-lg px-8 py-3 h-auto btn-shimmer hover-scale"
            >
              Get Started Free
            </Button>
            <Button 
              onClick={() => navigate('/demo')} 
              variant="outline"
              size="lg"
              className="text-lg px-8 py-3 h-auto hover-scale"
            >
              Try Demo
            </Button>
          </div>
        </div>
      </section>
      
      {/* KPI Section */}
      <section className="py-12 px-4 bg-muted/20">
        <div 
          ref={kpiReveal.ref}
          className={`max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 reveal ${kpiReveal.isVisible ? 'is-visible' : ''}`}
        >
          <div className="kpi-stat">
            <span className="kpi-number">
              <CountUp end={metrics.totalUsers} suffix="+" animateOnChange={false} />
            </span>
            <span className="kpi-label">Users Joined</span>
          </div>
          <div className="kpi-stat">
            <span className="kpi-number">
              <CountUp end={metrics.totalBudgets} suffix="+" animateOnChange={false} />
            </span>
            <span className="kpi-label">Budgets Created</span>
          </div>
          <div className="kpi-stat">
            <span className="kpi-number">
              <CountUp end={metrics.totalTransactions} suffix="+" animateOnChange={false} />
            </span>
            <span className="kpi-label">Transactions Tracked</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 
            ref={featuresReveal.ref}
            className={`text-3xl md:text-4xl font-bold text-center mb-12 reveal ${featuresReveal.isVisible ? 'is-visible' : ''}`}
          >
            Everything you need to manage your finances
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className={`text-center p-6 hover:shadow-lg transition-shadow reveal ${featuresReveal.isVisible ? 'is-visible' : ''}`}>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">AI Financial Assistant</h3>
              <p className="text-muted-foreground">
                Get personalized insights, spending recommendations, and financial advice powered by advanced AI
              </p>
            </Card>
            
            <Card className={`text-center p-6 hover:shadow-lg transition-shadow reveal reveal-delay-1 ${featuresReveal.isVisible ? 'is-visible' : ''}`}>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🏦</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Bank Integration</h3>
              <p className="text-muted-foreground">
                Securely connect your bank accounts to automatically track transactions and account balances
              </p>
            </Card>
            
            <Card className={`text-center p-6 hover:shadow-lg transition-shadow reveal reveal-delay-2 ${featuresReveal.isVisible ? 'is-visible' : ''}`}>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Smart Analytics</h3>
              <p className="text-muted-foreground">
                Visualize your spending patterns, track goals, and get actionable insights about your financial health
              </p>
            </Card>
            
            <Card className={`text-center p-6 hover:shadow-lg transition-shadow reveal ${featuresReveal.isVisible ? 'is-visible' : ''}`}>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💳</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Transaction Tracking</h3>
              <p className="text-muted-foreground">
                Automatically categorize expenses, search transactions, and understand where your money goes
              </p>
            </Card>
            
            <Card className={`text-center p-6 hover:shadow-lg transition-shadow reveal reveal-delay-1 ${featuresReveal.isVisible ? 'is-visible' : ''}`}>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Goal Setting</h3>
              <p className="text-muted-foreground">
                Set financial goals, track progress, and get AI-powered recommendations to achieve them faster
              </p>
            </Card>
            
            <Card className={`text-center p-6 hover:shadow-lg transition-shadow reveal reveal-delay-2 ${featuresReveal.isVisible ? 'is-visible' : ''}`}>
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

      {/* Trusted By Marquee */}
      <TrustedByMarquee />

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 
            ref={ctaReveal.ref}
            className={`text-3xl md:text-4xl font-bold mb-6 reveal ${ctaReveal.isVisible ? 'is-visible' : ''}`}
          >
            Ready to take control of your finances?
          </h2>
          <p className={`text-xl text-muted-foreground mb-8 reveal reveal-delay-1 ${ctaReveal.isVisible ? 'is-visible' : ''}`}>
            Join thousands of users who have transformed their financial lives with Budget AI.
          </p>
          <div className={`flex flex-col sm:flex-row gap-4 justify-center reveal reveal-delay-2 ${ctaReveal.isVisible ? 'is-visible' : ''}`}>
            <Button 
              onClick={() => navigate('/auth')} 
              size="lg"
              className="text-lg px-8 py-3 h-auto btn-shimmer hover-scale"
            >
              Start Your Financial Journey
            </Button>
            <Button 
              onClick={() => navigate('/demo')} 
              variant="outline"
              size="lg"
              className="text-lg px-8 py-3 h-auto hover-scale"
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
