import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useDemo } from '@/hooks/useDemo';
import Dashboard from '@/components/Dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Index = () => {
  const { user, loading } = useAuth();
  const { isDemo } = useDemo();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      // User is authenticated, they can stay on dashboard
      return;
    }
  }, [user]);

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
    return <Dashboard />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Welcome to Budget AI</CardTitle>
          <CardDescription className="text-lg">
            Your personal finance companion. Track expenses, manage bills, and take control of your financial future.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 text-center">
            <div className="p-4 border border-border rounded-lg">
              <h3 className="font-semibold mb-2">📊 Financial Overview</h3>
              <p className="text-sm text-muted-foreground">Get a complete snapshot of your financial health</p>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <h3 className="font-semibold mb-2">💳 Transaction Tracking</h3>
              <p className="text-sm text-muted-foreground">Categorize and search through all your transactions</p>
            </div>
            <div className="p-4 border border-border rounded-lg">
              <h3 className="font-semibold mb-2">📅 Bill Management</h3>
              <p className="text-sm text-muted-foreground">Never miss a payment with our bill reminder system</p>
            </div>
          </div>
          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/auth')} 
              className="w-full"
              size="lg"
            >
              Get Started
            </Button>
            <Button 
              onClick={() => navigate('/demo')} 
              variant="outline"
              className="w-full"
              size="lg"
            >
              Try a 5-message demo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
