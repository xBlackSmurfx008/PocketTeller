import { lazy, Suspense, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDemo } from '@/hooks/useDemo';

const Dashboard = lazy(() => import('@/components/Dashboard'));
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import CallToAction from '@/components/CallToAction';
import Footer from '@/components/Footer';


const Index = () => {
  const { user, loading } = useAuth();
  const { isDemo } = useDemo();

  // Set page title
  useEffect(() => {
    document.title = "Pocket Banker - Linear-Style Finance Management";
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
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      <Features />
      <CallToAction />
      <Footer />
    </div>
  );
};

export default Index;
