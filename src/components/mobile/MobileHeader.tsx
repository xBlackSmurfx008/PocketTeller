import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const MobileHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="flex items-center justify-between px-4 h-16">
        {/* Logo */}
        <div 
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">PB</span>
          </div>
          <span className="font-bold text-lg">Pocket Banker</span>
        </div>

        {/* Sign In Button */}
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate("/auth")}
          className="h-9 px-4"
        >
          <User className="w-4 h-4 mr-2" />
          Sign In
        </Button>
      </div>
    </header>
  );
};