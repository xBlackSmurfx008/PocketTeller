import React from 'react';
import { useDemo } from '@/hooks/useDemo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, MessageSquare, Target, Receipt } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DemoWelcome: React.FC = () => {
  const { isDemo, promptsUsed, maxPrompts, conversationsUsed, maxConversations } = useDemo();
  const navigate = useNavigate();

  if (!isDemo || promptsUsed > 0 || conversationsUsed > 0) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Sparkles className="w-5 h-5 mr-2 text-primary" />
          Welcome to Demo Mode!
        </CardTitle>
        <CardDescription>
          You're now exploring Pocket Banker with sample data. Try these features:
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate('/chat')}
            className="flex items-center justify-start h-auto p-3"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            <div className="text-left">
              <div className="font-medium">AI Assistant</div>
              <div className="text-xs text-muted-foreground">{maxPrompts} messages available</div>
            </div>
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => navigate('/goals')}
            className="flex items-center justify-start h-auto p-3"
          >
            <Target className="w-4 h-4 mr-2" />
            <div className="text-left">
              <div className="font-medium">Goals</div>
              <div className="text-xs text-muted-foreground">View sample goals</div>
            </div>
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => navigate('/transactions')}
            className="flex items-center justify-start h-auto p-3"
          >
            <Receipt className="w-4 h-4 mr-2" />
            <div className="text-left">
              <div className="font-medium">Transactions</div>
              <div className="text-xs text-muted-foreground">Explore data</div>
            </div>
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground">
          💡 <strong>Try asking the AI:</strong> "How much did I spend on groceries?" or "Help me create a budget"
        </p>
      </CardContent>
    </Card>
  );
};