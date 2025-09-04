import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/hooks/useDemo";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Menu } from "lucide-react";
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
    loadThread,
    typingMessageId
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
    console.debug('Question clicked:', question);
    handleSendMessage(question, [], false);
  };

  // Handle prompt suggestion clicks
  const handlePromptSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion, [], false);
  };
  return <div className="min-h-screen bg-background flex flex-col content-visible">
      {/* Header */}
      <header className="border-b border-border p-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="md:hidden" aria-label="Go back to dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">AI Financial Assistant</h1>
              {isDemo && <p className="text-sm text-muted-foreground">
                  Demo Mode: {promptsUsed}/{maxPrompts} messages used
                </p>}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isMobile && <Button variant="ghost" size="icon" onClick={() => setShowSidebar(!showSidebar)} aria-label="Toggle sidebar menu">
                <Menu className="h-4 w-4" />
              </Button>}
            
            {!isMobile && <Button variant="outline" onClick={() => navigate('/')}>
                Back to Dashboard
              </Button>}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
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
            {messages.map(message => (
              <MessageBubble 
                key={message.id} 
                message={message} 
                isTyping={typingMessageId === message.id}
              />
            ))}

            {/* Error Display */}
            {error && <Card className="border-destructive">
                <CardContent className="pt-6">
                  <p className="text-destructive text-sm">Error: {error}</p>
                </CardContent>
              </Card>}

            {/* Prompt Suggestions */}
            {showPromptSuggestions && messages.length === 0 && <Reveal delay={300} className="relative isolate z-40">
                <Card className="mx-auto max-w-2xl card-hover-lift relative z-30 pointer-events-auto">
                  <CardHeader>
                    <CardTitle className="text-lg">Get started with these questions:</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4">
                      {promptSuggestions.slice(0, 2).map((suggestion, index) => (
                        <Button 
                          key={index} 
                          variant="outline" 
                          className="flex items-start justify-start h-auto p-6 text-sm whitespace-normal leading-relaxed min-h-[96px] hover:bg-muted/50 active:bg-muted cursor-pointer touch-manipulation pointer-events-auto rounded-lg border-2 hover:border-primary/20 transition-all duration-200 relative z-50" 
                          onClick={(e) => {
                            console.log('Button clicked:', suggestion, e.target);
                            handlePromptSuggestionClick(suggestion);
                          }} 
                          disabled={isLoading}
                          aria-label={`Ask: ${suggestion}`}
                        >
                          <span className="break-words text-left w-full">{suggestion}</span>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </Reveal>}

            <div ref={messagesEndRef} />
            {/* Bottom spacer to ensure content is not overlapped */}
            <div className="h-4"></div>
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t" data-tour-id="chat-input">
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

      {/* Education Panel - only show after first message */}
      {messages.length > 0 && (
        <div data-tour-id="education-panel">
          <EducationPanel suggestions={educationSuggestions} coachQuestions={coachQuestions} coachStage={coachStage} onQuestionClick={handleQuestionClick} onToggle={() => setShowSuggestions(!showSuggestions)} isVisible={showSuggestions} />
        </div>
      )}
    </div>;
};
export default ConversationalAI;