import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const PublicHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="absolute top-0 left-0 right-0 z-20 bg-background/80 backdrop-blur-sm border-b border-border/50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="font-semibold text-lg cursor-pointer" onClick={() => navigate('/')}>
          Pocket Banker
        </div>
        <nav className="flex items-center gap-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/for-institutions')}>
            For Institutions
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/for-nonprofits')}>
            For Non-Profits
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/auth')} aria-label="Sign in">
            Sign In
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default PublicHeader;