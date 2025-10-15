import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/hooks/useDemo";
import { useIsMobile } from "@/hooks/useMobile";
import { useToast } from "@/hooks/useToast";
import { useConversation, EducationSuggestion } from "@/hooks/useConversation";
import { supabase } from "@/integrations/supabase/client";
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
  // Financial Review removed
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

  // (Removed) Financial Review

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
  return <div className="min-h-screen bg-background flex flex-col content-visible">
      {/* Main Content */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full overflow-hidden">
        {/* Messages Area - With proper bottom spacing */}
        <ScrollArea className="flex-1 pt-perfect px-4 pb-2">
          <div className="space-y-4">
            {/* Financial Review removed */}

            {/* Welcome Message */}
            {messages.length === 0 && <Reveal>
                <Card className="mx-auto max-w-2xl card-hover-lift">
                  <CardHeader>
                    <CardTitle className="text-center text-gradient">Welcome to your AI Financial Assistant!</CardTitle>
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

            {/* AI Thinking Indicator */}
            {isLoading && (
              <div className="flex gap-3 mb-4">
                <div className="w-8 h-8 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg 
                    className="w-5 h-5 text-primary" 
                    fill="none" 
                    viewBox="0 0 24 24"
                    style={{
                      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                    }}
                  >
                    {/* Brain/AI icon with subtle pulse */}
                    <path 
                      stroke="currentColor" 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth="2" 
                      d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="flex flex-col max-w-[80%] items-start">
                  <div className="rounded-2xl px-4 py-3 bg-muted/50 text-muted-foreground border border-border/50">
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm font-medium">Analyzing your question</span>
                      <span className="flex gap-1" aria-label="Loading">
                        <span 
                          className="w-1.5 h-1.5 rounded-full bg-primary/70" 
                          style={{ 
                            animation: 'bounce 1.4s infinite ease-in-out both',
                            animationDelay: '0s'
                          }}
                        ></span>
                        <span 
                          className="w-1.5 h-1.5 rounded-full bg-primary/70" 
                          style={{ 
                            animation: 'bounce 1.4s infinite ease-in-out both',
                            animationDelay: '0.16s'
                          }}
                        ></span>
                        <span 
                          className="w-1.5 h-1.5 rounded-full bg-primary/70" 
                          style={{ 
                            animation: 'bounce 1.4s infinite ease-in-out both',
                            animationDelay: '0.32s'
                          }}
                        ></span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

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

            {/* Education Panel - Integrated with messages */}
            {(educationSuggestions.length > 0 || coachQuestions.length > 0) && (
              <div className="mt-4" data-tour-id="education-panel">
                <EducationPanel 
                  suggestions={educationSuggestions} 
                  coachQuestions={coachQuestions} 
                  coachStage={coachStage} 
                  onQuestionClick={handleQuestionClick} 
                  onToggle={() => setShowSuggestions(!showSuggestions)} 
                  isVisible={showSuggestions} 
                />
              </div>
            )}
            
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </ScrollArea>

        {/* Message Input - Fixed at bottom with proper spacing and safe-area padding */}
        <div className="sticky bottom-0 bg-background border-t border-border/40 pt-4 px-4 safe-area-pb" data-tour-id="chat-input">
          <div className="max-w-4xl mx-auto space-y-3">
            <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} disabled={isDemo && promptsUsed >= maxPrompts} />
            
            {isDemo && promptsUsed >= maxPrompts && <Card className="border-orange-200 bg-orange-50">
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
            
            {isDemo && <div className="text-center">
              <div className="text-xs text-muted-foreground">
                Demo: {promptsUsed}/{maxPrompts} messages used
              </div>
            </div>}
          </div>
        </div>
      </div>
    </div>;
};
export default ConversationalAI;