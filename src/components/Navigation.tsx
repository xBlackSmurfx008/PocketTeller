import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand */}
          <div className="flex items-center">
            <a href="/" className="text-xl font-bold text-foreground">
              Pocket Banker
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors focus-ring">
              Product
            </a>
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors focus-ring">
              Features
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors focus-ring">
              Pricing
            </a>
            <a href="#company" className="text-muted-foreground hover:text-foreground transition-colors focus-ring">
              Company
            </a>
            <a href="#blog" className="text-muted-foreground hover:text-foreground transition-colors focus-ring">
              Blog
            </a>
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              Log in
            </Button>
            <Button size="sm" className="gradient-primary hover-glow">
              Start building
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMenu}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden glass border-t border-border/50 motion-safe:animate-fade-in motion-safe:animate-slide-in-right">
          <div className="px-4 py-6 space-y-4">
            <a
              href="#features"
              className="block text-muted-foreground hover:text-foreground transition-colors focus-ring"
              onClick={() => setIsMenuOpen(false)}
            >
              Product
            </a>
            <a
              href="#features"
              className="block text-muted-foreground hover:text-foreground transition-colors focus-ring"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="#pricing"
              className="block text-muted-foreground hover:text-foreground transition-colors focus-ring"
              onClick={() => setIsMenuOpen(false)}
            >
              Pricing
            </a>
            <a
              href="#company"
              className="block text-muted-foreground hover:text-foreground transition-colors focus-ring"
              onClick={() => setIsMenuOpen(false)}
            >
              Company
            </a>
            <a
              href="#blog"
              className="block text-muted-foreground hover:text-foreground transition-colors focus-ring"
              onClick={() => setIsMenuOpen(false)}
            >
              Blog
            </a>
            <div className="pt-4 space-y-3">
              <Button variant="ghost" className="w-full">
                Log in
              </Button>
              <Button className="w-full gradient-primary hover-glow">
                Start building
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;