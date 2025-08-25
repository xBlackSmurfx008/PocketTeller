import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import aiAvatar from "@/assets/ai-avatar.png";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDemo } from "@/hooks/useDemo";
import { useTimezone } from "@/hooks/useTimezone";
import { useDateHelpers } from "@/utils/dateUtils";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { Send, Plus, Upload, X, GraduationCap, Loader2, BookOpen, ExternalLink, MessageCircle, ArrowLeft, Lightbulb, ThumbsUp, ThumbsDown, Menu } from "lucide-react";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: FileAttachment[];
}

interface FileAttachment {
  name: string;
  type: string;
  url: string;
  path?: string;
  status?: 'uploading' | 'ready' | 'failed';
}

interface EducationSuggestion {
  title: string;
  description: string;
  category: string;
  url: string;
}

interface GeminiChatResponse {
  response?: string;  // Primary content field from backend
  message?: string;   // Fallback for backward-compat
  model?: string;     // e.g., "gemini-2.5-pro"
  timestamp?: string;
  savedToDb?: boolean;  // Optional: if backend saves/enriches data
  educationSuggestions?: EducationSuggestion[];
  coach_stage?: string;
  coach_questions?: string[];
  error?: string;       // If backend sends errors
  debug?: {
    processedAttachments: number;
    processedNames: string[];
    skippedAttachments: number;
    attachmentErrors: number;
  };
}

// Helper function to safely convert Json to FileAttachment[]
const parseAttachments = (attachments: any): FileAttachment[] | undefined => {
  if (!attachments || !Array.isArray(attachments)) {
    return undefined;
  }
  
  try {
    return attachments.map(attachment => ({
      name: attachment.name || '',
      type: attachment.type || '',
      url: attachment.url || ''
    }));
  } catch (error) {
    console.error('Error parsing attachments:', error);
    return undefined;
  }
};

const ConversationalAI = () => {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDemo, usePrompt, promptsUsed, maxPrompts, exitDemo } = useDemo();
  const { timezone } = useTimezone();
  const dateHelpers = useDateHelpers(timezone);
  const isMobile = useIsMobile();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [coachMode, setCoachMode] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const [educationSuggestions, setEducationSuggestions] = useState<EducationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [coachQuestions, setCoachQuestions] = useState<string[]>([]);
  const [coachStage, setCoachStage] = useState<string>('');
  const [autoAskQuestions, setAutoAskQuestions] = useState(false);
  const [showPromptSuggestions, setShowPromptSuggestions] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const promptSuggestions = [
    "Analyze my spending patterns from the last month",
    "Help me create a budget for next month",
    "What are some strategies to reduce my expenses?",
    "How can I improve my credit score?",
    "Explain the difference between needs and wants",
    "Help me set realistic financial goals",
    "What should I know about emergency funds?",
    "How do I start investing with a small budget?"
  ];

  const loadConversationHistory = async () => {
    if (!threadId) return;
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedMessages = data.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.message,
        timestamp: new Date(msg.created_at),
        attachments: parseAttachments(msg.attachments)
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading conversation history:', error);
      toast.error('Failed to load conversation history.');
    }
  };

  const createNewThread = async () => {
    try {
      const { data, error } = await supabase
        .from('conversation_threads')
        .insert({ user_id: user?.id, title: 'New Conversation' })
        .select()
        .single();

      if (error) throw error;

      navigate(`/chat/${data.id}`);
    } catch (error) {
      console.error('Error creating new thread:', error);
      toast.error('Failed to create new conversation.');
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() && attachments.length === 0) return;
    
    if (isDemo && !usePrompt()) {
      toast.warning("Demo limit reached. Redirecting to dashboard...");
      setTimeout(() => {
        exitDemo();
        navigate('/');
      }, 2000);
      return;
    }
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Handle demo mode with local responses
      if (isDemo) {
        // Simulate thinking time
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        // Generate demo response based on user input
        const generateDemoResponse = (input: string): string => {
          const lowerInput = input.toLowerCase();
          
          if (lowerInput.includes('budget') || lowerInput.includes('spending')) {
            return "Based on your demo data, I can see you've spent $130.50 recently on groceries and gas. Your checking account balance is $2,850.75. I'd recommend creating a monthly budget with categories for essentials like food ($400), transportation ($200), and setting aside 20% for savings. Would you like me to help you create a detailed budget plan?";
          }
          
          if (lowerInput.includes('save') || lowerInput.includes('emergency') || lowerInput.includes('goal')) {
            return "Great question about savings! I see you already have an Emergency Fund goal with $3,500 saved toward your $10,000 target. You're 35% there! With your current savings account balance of $8,500, you're in a good position. I recommend aiming to save 3-6 months of expenses for emergencies. Would you like tips on how to accelerate your savings?";
          }
          
          if (lowerInput.includes('bill') || lowerInput.includes('payment')) {
            return "Looking at your upcoming bills, you have an Electric Bill of $120.50 due in 5 days and Internet bill of $79.99 due in 12 days. That's $200.49 in upcoming expenses. With your checking balance of $2,850.75, you're well covered. Consider setting up automatic payments to avoid late fees!";
          }
          
          if (lowerInput.includes('invest') || lowerInput.includes('stock') || lowerInput.includes('401k')) {
            return "Investment is a great way to build wealth! With your current financial position showing $8,500 in savings, you might consider starting with low-cost index funds. A common rule is to invest after you have an emergency fund (which you're working on). Start with 10-15% of your income in a diversified portfolio. Would you like to discuss different investment options?";
          }
          
          if (lowerInput.includes('credit') || lowerInput.includes('score') || lowerInput.includes('debt')) {
            return "Credit health is crucial for your financial future! To improve your credit score: pay bills on time (35% of score), keep credit utilization below 30% (30% of score), maintain older accounts, and monitor your credit report regularly. Your recent $2,500 direct deposit shows steady income, which helps with creditworthiness.";
          }
          
          // Default response
          return "Thank you for your question! In this demo mode, I can help you understand your financial picture using sample data. I see you have $2,850.75 in checking, $8,500 in savings, and you're working toward financial goals like your Emergency Fund ($3,500/$10,000) and Europe vacation ($1,200/$5,000). What specific area of your finances would you like to explore?";
        };
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: generateDemoResponse(inputMessage),
          timestamp: new Date()
        };

        setMessages(prev => [...prev, assistantMessage]);
        setAttachments([]);
        setIsLoading(false);
        return;
      }

      // Regular mode - call Gemini API
      const todayString = dateHelpers.getTodayString();
      const now = new Date();
      const nowUserLocal = timezone ? 
        new Intl.DateTimeFormat('en-CA', {
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).format(now).replace(',', '') :
        now.toISOString().slice(0, 16).replace('T', ' ');

      const { data, error } = await supabase.functions.invoke<GeminiChatResponse>('gemini-chat', {
        body: {
          message: inputMessage,
          conversation_history: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          attachments: attachments,
          thread_id: threadId,
          coach_mode: coachMode,
          timezone: timezone,
          todayString: todayString,
          nowUserLocal: nowUserLocal,
          clientNowISO: now.toISOString()
        }
      });

      if (error) throw error;

      // Enhanced logging for debugging
      console.log('gemini-chat data:', data);
      console.table(data);

      // Log debug info for attachment processing
      const debugInfo = data?.debug;
      if (debugInfo) {
        console.log('Attachment processing results:', debugInfo);
        
        // Show warning if files couldn't be processed
        if (attachments.length > 0 && debugInfo.processedAttachments === 0) {
          toast.error("Your file couldn't be processed. Try re-uploading or use a smaller PDF.");
        }
      }

      // Extract content with fallback and validation
      const content = data?.response ?? data?.message;
      if (!content) {
        toast.error('AI returned no content');
        return;
      }

      // Check for backend error field
      if (data?.error) {
        toast.error('AI error: ' + data.error);
        return;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Handle education suggestions from AI response
      if (data?.educationSuggestions && data.educationSuggestions.length > 0) {
        setEducationSuggestions(data.educationSuggestions);
        setShowSuggestions(true);
      }

      // Handle coaching questions from AI response
      if (data?.coach_questions) {
        setCoachQuestions(data.coach_questions);
      }

      if (data?.coach_stage) {
        setCoachStage(data.coach_stage);
      }

      // Clear attachments after successful response
      setAttachments([]);
      
      // Conditional DB re-sync to prevent drift
      if (data?.savedToDb === true) {
        await loadConversationHistory();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File upload triggered');
    
    const files = event.target.files;
    if (!files || files.length === 0) {
      console.log('No files selected');
      return;
    }

    console.log(`Selected ${files.length} files`);

    // Check if user is authenticated
    if (!user) {
      toast.error('Please log in to upload files');
      return;
    }

    // Generate consistent timestamp for this batch
    const batchTs = Date.now();

    // Add optimistic attachments immediately
    const optimisticAttachments: FileAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size}`);
      
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Maximum size is 10MB.`);
        continue;
      }

      // Extended file type support
      const allowedTypes = [
        'image/', 'application/pdf', 'text/', 'application/json', 'text/csv',
        'audio/', 'video/', 'application/vnd.openxmlformats-officedocument',
        'application/msword', 'application/vnd.ms-excel'
      ];
      const isAllowed = allowedTypes.some(type => file.type.startsWith(type)) || 
        file.name.endsWith('.md') || file.name.endsWith('.log') || file.name.endsWith('.txt');
      
      if (!isAllowed) {
        toast.error(`File type not supported: ${file.name}. Supported: images, PDFs, text, audio, video, documents.`);
        continue;
      }

      // Add optimistic attachment
      const fileId = `${batchTs}-${i}-${file.name}`;
      optimisticAttachments.push({
        name: file.name,
        type: file.type,
        url: '',
        status: 'uploading'
      });
      setUploadingFiles(prev => new Set(prev).add(fileId));
    }

    // Add optimistic attachments to UI immediately
    setAttachments(prev => [...prev, ...optimisticAttachments]);

    // Process uploads
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileId = `${batchTs}-${i}-${file.name}`;
      
      // Skip if validation failed
      if (!optimisticAttachments.find(a => a.name === file.name)) continue;

      try {
        // Upload to Supabase Storage
        const filePath = `${user.id}/${batchTs}-${file.name}`;
        console.log(`Uploading to path: ${filePath}`);
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('chat-uploads')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        console.log('Upload successful:', uploadData);

        // Get signed URL for preview
        const { data: signedUrlData } = await supabase.storage
          .from('chat-uploads')
          .createSignedUrl(filePath, 3600); // 1 hour expiry

        // Update attachment status to ready with path
        setAttachments(prev => prev.map(attachment => 
          attachment.name === file.name && attachment.status === 'uploading'
            ? { ...attachment, url: signedUrlData?.signedUrl || filePath, path: filePath, status: 'ready' as const }
            : attachment
        ));
        
        console.log(`File processed successfully: ${file.name}`);
        toast.success(`Uploaded ${file.name}`);
      } catch (error) {
        console.error('Error uploading file:', error);
        
        // Update attachment status to failed
        setAttachments(prev => prev.map(attachment => 
          attachment.name === file.name && attachment.status === 'uploading'
            ? { ...attachment, status: 'failed' as const }
            : attachment
        ));
        
        toast.error(`Failed to upload ${file.name}`);
      } finally {
        setUploadingFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(fileId);
          return newSet;
        });
      }
    }
    
    // Clear the input value to allow re-selecting the same file
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => {
      const newAttachments = [...prev];
      newAttachments.splice(index, 1);
      return newAttachments;
    });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    loadConversationHistory();
  }, [threadId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Mobile Header */}
      {isMobile ? (
        <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-1 text-xs"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={aiAvatar} alt="AI Assistant" />
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>
            <h1 className="text-lg font-semibold text-foreground">AI Assistant</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSidebar(!showSidebar)}
            className="flex items-center gap-1 text-xs"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        /* Desktop Header */
        <div className="max-w-7xl mx-auto w-full p-4">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={aiAvatar} alt="AI Assistant" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <h1 className="text-3xl font-bold text-foreground">AI Financial Assistant</h1>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <Label htmlFor="coach-mode" className="text-sm font-medium">
                    Coach Mode
                  </Label>
                  <Switch
                    id="coach-mode"
                    checked={coachMode}
                    onCheckedChange={setCoachMode}
                  />
                </div>
                
                {coachMode && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="auto-ask"
                      checked={autoAskQuestions}
                      onChange={(e) => setAutoAskQuestions(e.target.checked)}
                      className="rounded border-border"
                    />
                    <Label htmlFor="auto-ask" className="text-sm text-muted-foreground">
                      Auto-ask coaching questions
                    </Label>
                  </div>
                )}
              </div>
            </div>
            <Button 
              onClick={createNewThread}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Conversation
            </Button>
          </div>
        </div>
      )}

      <div className={`flex flex-1 ${isMobile ? 'flex-col' : 'max-w-7xl mx-auto w-full px-4 flex-row gap-6'}`}>
        {/* Main Chat Area */}
        <div className={`flex-1 flex flex-col ${isMobile ? 'h-full' : ''}`}>
          {!isMobile && coachMode && (
            <Card className="mb-4 border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <GraduationCap className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-primary mb-1">Coach Mode Enabled</h3>
                    <p className="text-sm text-muted-foreground">
                      I'll provide educational guidance, ask reflective questions, and help you build better financial habits step-by-step. 
                      Perfect for learning budgeting fundamentals or advancing your money management skills.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Demo Mode Banner */}
          {isDemo && (
            <Card className="mb-4 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900">
                      <MessageCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-amber-800 dark:text-amber-200">Demo Mode</h3>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Try the AI assistant with sample data • {promptsUsed}/{maxPrompts} messages used
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      exitDemo();
                      navigate('/');
                    }}
                    className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900"
                  >
                    Exit Demo
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Messages Display */}
          <div className={`flex-1 ${isMobile ? 'px-4 pb-2' : ''}`}>
            <Card className={`${isMobile ? 'h-full' : 'mb-4'}`}>
              <CardContent className="p-4 h-full">
                <ScrollArea className={`${isMobile ? 'h-full' : 'h-[400px]'} pr-4`}>
                  {/* Prompt Suggestions in Chat */}
                  {showPromptSuggestions && messages.length === 0 && (
                    <div className="mb-4 p-4 border border-primary/20 bg-primary/5 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-primary" />
                          <h3 className="text-sm font-medium text-primary">Get Started</h3>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPromptSuggestions(false)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">Try asking about these financial topics</p>
                      <div className={`grid gap-2 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        {promptSuggestions.slice(0, isMobile ? 4 : 8).map((suggestion, index) => (
                          <Button
                            key={index}
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setInputMessage(suggestion);
                              setShowPromptSuggestions(false);
                            }}
                            className="text-left justify-start h-auto p-2 text-xs whitespace-normal border border-border/30 hover:border-primary/30"
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {messages.map((msg) => (
                    <div key={msg.id} className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start items-start gap-2'}`}>
                      {msg.role === 'assistant' && (
                        <Avatar className="w-6 h-6 mt-1 shrink-0">
                          <AvatarImage src={aiAvatar} alt="AI Assistant" />
                          <AvatarFallback>AI</AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`rounded-lg p-3 ${isMobile ? 'max-w-[85%]' : 'max-w-[80%]'} ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <p className={`${isMobile ? 'text-sm' : 'text-sm'} whitespace-pre-line`}>{msg.content}</p>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2">
                            {msg.attachments.map((attachment, index) => (
                              <div key={index} className="text-xs text-blue-400 underline">
                                <a href={attachment.url} target="_blank" rel="noopener noreferrer">{attachment.name}</a>
                              </div>
                            ))}
                          </div>
                        )}
                        {msg.role === 'assistant' && (
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`${isMobile ? 'h-8 w-8' : 'h-6 w-6'} p-0 hover:bg-green-100 hover:text-green-600`}
                              onClick={() => toast.success("Feedback recorded!")}
                            >
                              <ThumbsUp className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3'}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`${isMobile ? 'h-8 w-8' : 'h-6 w-6'} p-0 hover:bg-red-100 hover:text-red-600`}
                              onClick={() => toast.info("Thanks for the feedback!")}
                            >
                              <ThumbsDown className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3'}`} />
                            </Button>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {msg.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                  
                  {/* Thinking indicator */}
                  {isLoading && (
                    <div className="mb-4 flex justify-start items-start gap-2">
                      <Avatar className="w-6 h-6 mt-1 shrink-0">
                        <AvatarImage src={aiAvatar} alt="AI Assistant" />
                        <AvatarFallback>AI</AvatarFallback>
                      </Avatar>
                      <div className={`rounded-lg p-3 ${isMobile ? 'max-w-[85%]' : 'max-w-[80%]'} bg-muted`}>
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <p className="text-sm">Thinking...</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Mobile Input Bar - Fixed at bottom */}
          {isMobile && (
            <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              {/* Attachments Preview */}
              {attachments.length > 0 && (
                <div className="px-4 py-2 border-b">
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((attachment, index) => (
                      <div key={index} className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs ${
                        attachment.status === 'uploading' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                        attachment.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                        'bg-muted'
                      }`}>
                        <span>
                          {attachment.name}
                          {attachment.status === 'uploading' && ' (uploading...)'}
                          {attachment.status === 'failed' && ' (failed)'}
                        </span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveAttachment(index)}
                          disabled={attachment.status === 'uploading'}
                          className="h-4 w-4 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="p-4">
                <div className="flex items-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={triggerFileInput}
                    className="h-10 w-10 p-0 shrink-0"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                  <div className="flex-1 relative">
                    <Textarea
                      placeholder={isDemo ? `Type your message... (${promptsUsed}/${maxPrompts} demo messages used)` : "Type your message..."}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      onFocus={() => setShowPromptSuggestions(false)}
                      className="min-h-[40px] max-h-[120px] resize-none text-base"
                      data-tour-id="chat-input"
                    />
                  </div>
                  <Button
                    onClick={sendMessage}
                    disabled={isLoading || uploadingFiles.size > 0 || !inputMessage.trim()}
                    size="sm"
                    className="h-10 w-10 p-0 shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/*,.pdf,.txt,.csv,.json,.md,.log,text/*,audio/*,video/*,.doc,.docx,.xls,.xlsx"
                onChange={handleFileUpload}
                className="sr-only"
                ref={fileInputRef}
              />
            </div>
          )}

          {/* Desktop Input Area */}
          {!isMobile && (
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder={isDemo ? `Type your message... (${promptsUsed}/${maxPrompts} demo messages used)` : "Type your message..."}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                onFocus={() => setShowPromptSuggestions(false)}
                className="flex-grow"
                data-tour-id="chat-input"
              />
              <label htmlFor="file-upload-desktop" className="cursor-pointer">
                <Button
                  type="button"
                  variant="secondary"
                  asChild
                  className="flex items-center gap-2"
                >
                  <span>
                    <Upload className="h-4 w-4" />
                    Attach
                  </span>
                </Button>
              </label>
              <Button
                onClick={sendMessage}
                disabled={isLoading || uploadingFiles.size > 0}
                className="flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {uploadingFiles.size > 0 ? `Uploading ${uploadingFiles.size}...` : isLoading ? 'Sending...' : 'Send'}
              </Button>
              <input
                id="file-upload-desktop"
                type="file"
                multiple
                accept="image/*,.pdf,.txt,.csv,.json,.md,.log,text/*,audio/*,video/*,.doc,.docx,.xls,.xlsx"
                onChange={handleFileUpload}
                className="sr-only"
                ref={fileInputRef}
              />
            </div>
          )}
        </div>

        {/* Right Sidebar - Resources (Hidden on mobile unless toggled) */}
        {(showSidebar || !isMobile) && (
          <div className={`${isMobile ? 'fixed inset-0 z-50 bg-background' : 'w-full lg:w-80'} space-y-4 ${isMobile ? 'p-4 overflow-y-auto' : ''}`}>
            {isMobile && (
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Resources & Settings</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSidebar(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Coach Mode Settings - Mobile */}
            {isMobile && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-primary" />
                        <Label htmlFor="coach-mode-mobile" className="text-sm font-medium">
                          Coach Mode
                        </Label>
                      </div>
                      <Switch
                        id="coach-mode-mobile"
                        checked={coachMode}
                        onCheckedChange={setCoachMode}
                      />
                    </div>
                    
                    {coachMode && (
                      <div className="flex items-center justify-between">
                        <Label htmlFor="auto-ask-mobile" className="text-sm text-muted-foreground">
                          Auto-ask coaching questions
                        </Label>
                        <input
                          type="checkbox"
                          id="auto-ask-mobile"
                          checked={autoAskQuestions}
                          onChange={(e) => setAutoAskQuestions(e.target.checked)}
                          className="rounded border-border"
                        />
                      </div>
                    )}

                    {coachMode && (
                      <div className="pt-2 border-t">
                        <p className="text-xs text-muted-foreground">
                          I'll provide educational guidance, ask reflective questions, and help you build better financial habits step-by-step.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* New Conversation Button - Mobile */}
            {isMobile && (
              <Button 
                onClick={createNewThread}
                variant="outline"
                className="w-full flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                New Conversation
              </Button>
            )}
            {/* Education Suggestions */}
            {showSuggestions && educationSuggestions.length > 0 && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      <CardTitle className="text-sm text-primary">Suggested Learning</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSuggestions(false)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <CardDescription className="text-xs">
                    Based on your financial profile
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {educationSuggestions.map((suggestion, index) => (
                    <div key={index} className="space-y-1">
                      <a 
                        href={suggestion.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-between text-xs text-primary hover:underline group"
                      >
                        <span className="font-medium">{suggestion.title}</span>
                        <ExternalLink className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                      </a>
                      <p className="text-xs text-muted-foreground">{suggestion.description}</p>
                    </div>
                  ))}
                  <div className="pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.open('https://www.consumerfinance.gov/consumer-tools/educator-tools/adult-financial-education/', '_blank');
                      }}
                      className="w-full text-xs h-8"
                    >
                      <BookOpen className="h-3 w-3 mr-1" />
                      Explore All Resources
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Manual Suggest Education Button */}
            {!showSuggestions && (
              <Card>
                <CardContent className="p-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Generate contextual suggestions
                      const defaultSuggestions: EducationSuggestion[] = [
                        {
                          title: "Budgeting Basics",
                          description: "Learn fundamental budgeting strategies and tools",
                          category: "budgeting",
                          url: "https://www.consumerfinance.gov/consumer-tools/educator-tools/adult-financial-education/library/budgeting/"
                        },
                        {
                          title: "Building Credit",
                          description: "Understand credit scores and how to improve them",
                          category: "credit",
                          url: "https://www.consumerfinance.gov/consumer-tools/educator-tools/adult-financial-education/library/credit/"
                        },
                        {
                          title: "Emergency Savings",
                          description: "Steps to build and maintain your financial safety net",
                          category: "saving",
                          url: "https://www.consumerfinance.gov/consumer-tools/educator-tools/adult-financial-education/library/saving/"
                        }
                      ];
                      setEducationSuggestions(defaultSuggestions);
                      setShowSuggestions(true);
                    }}
                    className="w-full text-xs h-8"
                  >
                    <GraduationCap className="h-3 w-3 mr-1" />
                    Suggest Education
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Coaching Questions */}
            {coachMode && coachQuestions.length > 0 && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm text-primary">Coaching Questions</CardTitle>
                    {coachStage && <span className="text-xs text-muted-foreground">({coachStage})</span>}
                  </div>
                  <CardDescription className="text-xs">
                    Reflective questions to guide your thinking
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {coachQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setInputMessage(question);
                        if (autoAskQuestions) {
                          sendMessage();
                        }
                      }}
                      className="w-full text-left p-2 text-xs bg-muted/50 hover:bg-muted rounded-md transition-colors border border-border/50"
                    >
                      {question}
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Financial Resources */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  <CardTitle className="text-sm">Financial Resources</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Evidence-based research and tools
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">CFPB Research Findings</h4>
                  <ul className="text-xs space-y-1">
                    <li className="flex items-start gap-1">
                      <span className="text-primary">•</span>
                      <span>Financial coaching increases savings by avg $1,187</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span className="text-primary">•</span>
                      <span>Reduces debt by avg $10,644</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span className="text-primary">•</span>
                      <span>21-point credit score improvement</span>
                    </li>
                    <li className="flex items-start gap-1">
                      <span className="text-primary">•</span>
                      <span>Focuses on behavior change over knowledge</span>
                    </li>
                  </ul>
                </div>
                
                <div className="pt-2 border-t space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground">Official Resources</h4>
                  <div className="space-y-1">
                    <a 
                      href="http://www.consumerfinance.gov/adult-financial-education" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between text-xs text-primary hover:underline group"
                    >
                      <span>CFPB Financial Education</span>
                      <ExternalLink className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                    </a>
                    <a 
                      href="https://files.consumerfinance.gov/f/documents/cfpb_financial-coaching-research-brief.pdf" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between text-xs text-primary hover:underline group"
                    >
                      <span>Coaching Research Study</span>
                      <ExternalLink className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Desktop Attachments Preview */}
      {!isMobile && attachments.length > 0 && (
        <div className="max-w-7xl mx-auto w-full px-4 pb-4">
          <p className="text-sm font-medium text-foreground">Attachments:</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {attachments.map((attachment, index) => (
              <div key={index} className={`flex items-center gap-1 px-2 py-1 rounded-md ${
                attachment.status === 'uploading' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                attachment.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                'bg-muted'
              }`}>
                <p className="text-xs">
                  {attachment.name}
                  {attachment.status === 'uploading' && ' (uploading...)'}
                  {attachment.status === 'failed' && ' (failed)'}
                </p>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => handleRemoveAttachment(index)}
                  disabled={attachment.status === 'uploading'}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationalAI;
