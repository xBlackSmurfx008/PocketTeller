import React from 'react';
import { useDemo } from '@/hooks/useDemo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Info } from 'lucide-react';

export const DemoModeIndicator: React.FC = () => {
  const { isDemo, exitDemo, promptsUsed, maxPrompts, conversationsUsed, maxConversations } = useDemo();

  if (!isDemo) return null;

  return (
    <div className="bg-primary/10 border-b border-primary/20 p-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="bg-primary/20 text-primary border-primary/30">
            <Info className="w-3 h-3 mr-1" />
            Demo Mode
          </Badge>
          <span className="text-sm text-muted-foreground">
            Messages: {promptsUsed}/{maxPrompts} • Conversations: {conversationsUsed}/{maxConversations}
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={exitDemo}
          className="text-primary hover:text-primary-foreground hover:bg-primary/90"
        >
          <X className="w-4 h-4 mr-1" />
          Exit Demo
        </Button>
      </div>
    </div>
  );
};