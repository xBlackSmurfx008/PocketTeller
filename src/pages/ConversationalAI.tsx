import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Mic, MicOff, Send, TestTube } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Speech Recognition types
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new(): SpeechRecognition;
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ConversationalAI() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading) return; // Wait for auth to finish loading
    
    if (!user) {
      navigate('/auth');
      return;
    }

    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: "Voice input error",
          description: "Could not process voice input. Please try again.",
          variant: "destructive",
        });
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    }

    // Load conversation history
    loadConversationHistory();
  }, [user, loading, navigate, toast]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversationHistory = async () => {
    if (!user) return; // Don't load if no user
    
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;

      const formattedMessages: Message[] = data.map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.message,
        timestamp: new Date(msg.created_at)
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading conversation history:', error);
    }
  };

  const startListening = () => {
    if (recognition && !isListening) {
      setIsListening(true);
      recognition.start();
    }
  };

  const stopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          message: userMessage.content,
          conversation_history: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (data.function_calls && data.function_calls.length > 0) {
        toast({
          title: "Action completed",
          description: "I've updated your financial data based on our conversation.",
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const testPlaidConnection = async () => {
    if (isLoading) return;

    const testMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: 'Test Plaid connection and generate sample data',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, testMessage]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          message: 'Please test the Plaid connection and generate some sample transaction data for me to see.',
          conversation_history: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      toast({
        title: "Plaid Test Completed",
        description: "Check the response for connection status and sample data.",
      });
    } catch (error) {
      console.error('Error testing Plaid:', error);
      toast({
        title: "Test Failed",
        description: "Failed to test Plaid connection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-foreground">Financial Assistant</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 h-[calc(100vh-80px)] flex flex-col">
        <Card className="flex-1 flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <h3 className="text-lg font-medium mb-2">Welcome to your Financial Assistant!</h3>
                  <p>I can help you with budgeting, setting goals, and analyzing your finances. Try asking me something like:</p>
                  <ul className="mt-4 space-y-1 text-sm">
                    <li>"Help me set a savings goal for a vacation"</li>
                    <li>"I want to increase my grocery budget"</li>
                    <li>"How am I doing with my spending this month?"</li>
                  </ul>
                </div>
              )}
              
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted text-foreground'
                  }`}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <div className="animate-pulse flex space-x-1">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animation-delay-200"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animation-delay-400"></div>
                      </div>
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="border-t border-border p-4">
            <div className="flex items-center space-x-2 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={testPlaidConnection}
                disabled={isLoading}
                className="text-xs"
              >
                <TestTube className="h-3 w-3 mr-1" />
                Test Plaid
              </Button>
              <span className="text-xs text-muted-foreground">Verify connection & generate sample data</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={isListening ? "destructive" : "outline"}
                size="sm"
                onClick={isListening ? stopListening : startListening}
                disabled={!recognition}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message or use voice input..."
                disabled={isLoading}
                className="flex-1"
              />
              
              <Button onClick={sendMessage} disabled={!input.trim() || isLoading} size="sm">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            {isListening && (
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Listening... Speak now
              </p>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}