import { useState } from 'react';
import { Gift, Send, Lightbulb } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';

export function ReferralProgram() {
  const { submitSuggestions, referralCredits } = useSubscription();
  const [suggestions, setSuggestions] = useState(['', '', '']);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validate all suggestions are filled
    const filledSuggestions = suggestions.filter(s => s.trim().length > 0);
    
    if (filledSuggestions.length < 3) {
      toast.error('Please provide all 3 suggestions to earn a free month');
      return;
    }

    setSubmitting(true);
    try {
      const formattedSuggestions = suggestions.map((text, index) => ({
        title: `Suggestion ${index + 1}`,
        description: text.trim(),
        category: 'improvement',
      }));

      const success = await submitSuggestions(formattedSuggestions);
      
      if (success) {
        // Clear form
        setSuggestions(['', '', '']);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = suggestions.every(s => s.trim().length > 10);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          Get 1 Free Month
        </CardTitle>
        <CardDescription>
          Share 3 product suggestions and earn an additional free month!
          {referralCredits > 0 && ` You've earned ${referralCredits} credit${referralCredits > 1 ? 's' : ''} so far! 🎉`}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="space-y-2">
            <Label htmlFor={`suggestion-${index}`} className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Suggestion {index + 1}
            </Label>
            <Textarea
              id={`suggestion-${index}`}
              placeholder={
                index === 0
                  ? "e.g., Add investment portfolio tracking feature..."
                  : index === 1
                  ? "e.g., Create a mobile widget for quick expense entry..."
                  : "e.g., Improve the budget visualization with charts..."
              }
              value={suggestion}
              onChange={(e) => {
                const newSuggestions = [...suggestions];
                newSuggestions[index] = e.target.value;
                setSuggestions(newSuggestions);
              }}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {suggestion.trim().length}/150 characters {suggestion.trim().length < 10 && '(min 10)'}
            </p>
          </div>
        ))}

        <div className="bg-muted p-4 rounded-lg text-sm">
          <p className="font-semibold mb-2">💡 Suggestion Ideas:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>New features you'd like to see</li>
            <li>Improvements to existing features</li>
            <li>User experience enhancements</li>
            <li>Integration requests</li>
            <li>Mobile app improvements</li>
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">
          ⏱️ You can earn 1 free month per month by providing valuable feedback.
        </p>
      </CardContent>

      <CardFooter>
        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={!isValid || submitting}
        >
          <Send className="mr-2 h-4 w-4" />
          {submitting ? 'Submitting...' : 'Submit & Earn Free Month'}
        </Button>
      </CardFooter>
    </Card>
  );
}

