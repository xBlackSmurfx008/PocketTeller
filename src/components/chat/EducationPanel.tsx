import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, BookOpen, Lightbulb } from 'lucide-react';
import { EducationSuggestion } from '@/hooks/useConversation';

interface EducationPanelProps {
  suggestions: EducationSuggestion[];
  coachQuestions: string[];
  coachStage: string;
  onQuestionClick: (question: string) => void;
  onToggle: () => void;
  isVisible: boolean;
}

export const EducationPanel = ({
  suggestions,
  coachQuestions,
  coachStage,
  onQuestionClick,
  onToggle,
  isVisible
}: EducationPanelProps) => {
  if (!isVisible) {
    return (
      <div className="fixed bottom-24 right-4 z-50">
        <Button
          onClick={onToggle}
          size="sm"
          variant="outline"
          className="bg-background shadow-lg"
        >
          <Lightbulb className="h-4 w-4 mr-2" />
          Learning
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-24 right-4 w-80 max-h-96 z-50">
      <Card className="shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              <CardTitle className="text-sm">Learning Center</CardTitle>
            </div>
            <Button onClick={onToggle} variant="ghost" size="sm">
              ×
            </Button>
          </div>
          {coachStage && (
            <Badge variant="secondary" className="w-fit">
              {coachStage}
            </Badge>
          )}
        </CardHeader>
        
        <CardContent className="pt-0 space-y-4 max-h-64 overflow-y-auto">
          {/* Coach Questions */}
          {coachQuestions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                <BookOpen className="h-3 w-3" />
                Suggested Questions
              </h4>
              <div className="space-y-2">
                {coachQuestions.map((question, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full text-left justify-start h-auto p-2 text-xs"
                    onClick={() => onQuestionClick(question)}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Education Suggestions */}
          {suggestions.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">Learn More</h4>
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <Card key={index} className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="text-xs font-medium line-clamp-2">
                          {suggestion.title}
                        </h5>
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          {suggestion.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {suggestion.description}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs p-1"
                        onClick={() => window.open(suggestion.url, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Learn
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {suggestions.length === 0 && coachQuestions.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              No learning suggestions available yet. Start a conversation to get personalized recommendations!
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};