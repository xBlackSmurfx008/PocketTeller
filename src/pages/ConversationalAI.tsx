import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/hooks/useDemo";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { useConversation, EducationSuggestion } from "@/hooks/useConversation";
import { MessageBubble } from "@/components/chat/MessageBubble";
import { MessageInput } from "@/components/chat/MessageInput";
import { EducationPanel } from "@/components/chat/EducationPanel";
import { Reveal } from "@/components/Reveal";
const ConversationalAI = () => {
  const {
    threadId
  } = useParams();
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const {
    isDemo,
    promptsUsed,
    maxPrompts,
    conversationsUsed,
    maxConversations,
    exitDemo
  } = useDemo();
  const isMobile = useIsMobile();
  const {
    toast
  } = useToast();
  const [educationSuggestions, setEducationSuggestions] = useState<EducationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [coachQuestions, setCoachQuestions] = useState<string[]>([]);
  const [coachStage, setCoachStage] = useState<string>('');
  const [showPromptSuggestions, setShowPromptSuggestions] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    loadThread
  } = useConversation(threadId);
  const promptSuggestions = ["Analyze my spending patterns from the last month", "Help me create a budget for next month", "What are some strategies to reduce my expenses?", "How can I improve my credit score?", "Explain the difference between needs and wants", "Help me set realistic financial goals", "What should I know about emergency funds?", "How do I start investing with a small budget?"];

  // Load conversation history on component mount
  useEffect(() => {
    if (threadId && !threadId.startsWith('demo-')) {
      loadThread(threadId);
    }
  }, [threadId, loadThread]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages]);

  // Handle message sending
  const handleSendMessage = async (content: string, attachments: any[], coachMode: boolean) => {
    const result = await sendMessage(content, attachments, coachMode);
    if (result && typeof result === 'object' && 'success' in result && result.success) {
      // Update education suggestions if provided
      if ('educationSuggestions' in result && result.educationSuggestions) {
        setEducationSuggestions(result.educationSuggestions);
      }

      // Update coach data if provided
      if ('coachQuestions' in result && result.coachQuestions) {
        setCoachQuestions(result.coachQuestions);
      }
      if ('coachStage' in result && result.coachStage) {
        setCoachStage(result.coachStage);
      }

      // Show suggestions panel if we have new content
      const hasEducationSuggestions = 'educationSuggestions' in result && result.educationSuggestions?.length;
      const hasCoachQuestions = 'coachQuestions' in result && result.coachQuestions?.length;
      if (hasEducationSuggestions || hasCoachQuestions) {
        setShowSuggestions(true);
      }

      // Hide prompt suggestions after first message
      setShowPromptSuggestions(false);
    }
  };

  // Handle quick question clicks
  const handleQuestionClick = (question: string) => {
    handleSendMessage(question, [], false);
  };

  // Handle prompt suggestion clicks
  const handlePromptSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion, [], false);
  };
  return <div className="min-h-screen bg-background flex flex-col content-visible content-container">
      {/* Main Content */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* Messages Area */}
        <ScrollArea className="flex-1 pt-perfect px-4 pb-4">
          <div className="space-y-4">
            {/* Welcome Message */}
            {messages.length === 0 && <Reveal>
                <Card className="mx-auto max-w-2xl card-hover-lift">
                  <CardHeader>
                    <CardTitle className="text-center text-gradient">Welcome to your AI Financial Assistant! </CardTitle>
                  <CardDescription className="text-center">
                    I'm here to help you manage your finances, analyze spending patterns, create budgets, and answer any financial questions you have.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      You can upload files (bank statements, receipts, etc.) or just ask me questions!
                    </p>
                    {isDemo && <p className="text-xs text-orange-600">
                        Demo mode: Limited to {maxPrompts} messages. Sign up for unlimited access!
                      </p>}
                  </div>
                </CardContent>
              </Card>
              </Reveal>}

            {/* Messages */}
            {messages.map(message => <MessageBubble key={message.id} message={message} />)}

            {/* Error Display */}
            {error && <Card className="border-destructive">
                <CardContent className="pt-6">
                  <p className="text-destructive text-sm">Error: {error}</p>
                </CardContent>
              </Card>}

            {/* Prompt Suggestions */}
            {showPromptSuggestions && messages.length === 0 && <Reveal delay={300}>
                <Card className="mx-auto max-w-2xl card-hover-lift">
                  <CardHeader>
                    <CardTitle className="text-lg">Get started with these questions:</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {promptSuggestions.slice(0, 6).map((suggestion, index) => <Button key={index} variant="outline" className="text-left justify-start h-auto p-4 text-sm ripple-effect whitespace-normal leading-relaxed min-h-[60px]" onClick={() => handlePromptSuggestionClick(suggestion)} disabled={isLoading}>
                          <span className="break-words">{suggestion}</span>
                        </Button>)}
                    </div>
                  </CardContent>
                </Card>
              </Reveal>}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="pt-perfect px-4 pb-4 border-t" data-tour-id="chat-input">
          <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} disabled={isDemo && promptsUsed >= maxPrompts} />
          
          {isDemo && promptsUsed >= maxPrompts && <Card className="mt-4 border-orange-200 bg-orange-50">
              <CardContent className="pt-4">
                <div className="text-center space-y-2">
                  <p className="text-sm text-orange-800">
                    You've reached the demo limit of {maxPrompts} messages.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => navigate('/auth')} size="sm">
                      Sign Up for Full Access
                    </Button>
                    <Button variant="outline" onClick={exitDemo} size="sm">
                      Exit Demo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>}
        </div>
      </div>

      {/* Education Panel */}
      <div data-tour-id="education-panel">
        <EducationPanel suggestions={educationSuggestions} coachQuestions={coachQuestions} coachStage={coachStage} onQuestionClick={handleQuestionClick} onToggle={() => setShowSuggestions(!showSuggestions)} isVisible={showSuggestions} />
      </div>

      {/* Essential actions at bottom for iOS thumb accessibility */}
      <div className="sticky bottom-20 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border/40 pt-perfect px-4 pb-4">
        <div className="max-w-4xl mx-auto flex justify-center items-center gap-4">
          {isDemo && <div className="text-sm text-muted-foreground">
            Demo: {promptsUsed}/{maxPrompts} messages
          </div>}
        </div>
      </div>
    </div>;
};
export default ConversationalAI;