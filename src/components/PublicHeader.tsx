import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

const PublicHeader = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  const navigationItems = [
    { label: "Pricing", path: "/pricing" },
    { label: "Pro Features", path: "/pro-preview" },
    { label: "For Institutions", path: "/for-institutions" },
    { label: "For Non-Profits", path: "/for-nonprofits" },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  if (isMobile) {
    return (
      <header className="absolute top-0 left-0 right-0 z-20 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div 
            className="font-semibold text-lg cursor-pointer" 
            onClick={() => navigate('/')}
          >
            Pocket Banker
          </div>
          
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <SheetHeader>
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-6">
                {navigationItems.map((item) => (
                  <Button
                    key={item.path}
                    variant="ghost"
                    className="justify-start"
                    onClick={() => handleNavigation(item.path)}
                  >
                    {item.label}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  onClick={() => handleNavigation('/auth')}
                  className="mt-4"
                >
                  Sign In
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </header>
    );
  }

  return (
    <header className="absolute top-0 left-0 right-0 z-20 bg-background/80 backdrop-blur-sm border-b border-border/50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div 
          className="font-semibold text-lg cursor-pointer" 
          onClick={() => navigate('/')}
        >
          Pocket Banker
        </div>
        <nav className="flex items-center gap-6">
          {navigationItems.map((item) => (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              onClick={() => navigate(item.path)}
            >
              {item.label}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/auth')}
            aria-label="Sign in"
          >
            Sign In
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default PublicHeader;