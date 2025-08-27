import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Reveal } from '@/components/Reveal';

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background content-visible">
      <Reveal>
        <div className="text-center card-hover-lift p-8 rounded-lg bg-card border border-border">
          <h1 className="text-4xl font-bold mb-4 text-gradient">404</h1>
          <p className="text-xl text-muted-foreground mb-4">Oops! Page not found</p>
          <Button onClick={() => navigate('/')} className="btn-magnetic ripple-effect">
            Return to Home
          </Button>
        </div>
      </Reveal>
    </div>
  );
};

export default NotFound;
