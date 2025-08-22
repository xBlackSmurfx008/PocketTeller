
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Mic, MicOff, Send, RefreshCw, Plus, X, Download, FileText, Image } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Speech Recognition types
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
}

export default function ConversationalAI() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }

    // Initialize speech recognition
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';

      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: "Voice Recognition Error",
          description: "Failed to recognize speech. Please try again.",
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversationHistory = async () => {
    if (!user) return;

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
        timestamp: new Date(msg.created_at),
        attachments: Array.isArray(msg.attachments) ? 
          (msg.attachments as unknown as Attachment[]) : []
      }));

      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error loading conversation history:', error);
    }
  };

  const syncTransactions = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('plaid-sync');
      
      if (error) throw error;

      toast({
        title: "Sync Complete", 
        description: `Updated ${data.accounts || 0} accounts and ${data.transactions || 0} transactions.`,
      });
    } catch (error) {
      console.error('Error syncing transactions:', error);
      toast({
        title: "Sync Failed",
        description: "Failed to sync transactions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const uploadFile = async (file: File): Promise<Attachment> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${user!.id}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('chat-uploads')
      .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('chat-uploads')
      .getPublicUrl(filePath);

    return {
      id: Date.now().toString(),
      name: file.name,
      type: file.type,
      size: file.size,
      url: publicUrl
    };
  };

  const handleFileUpload = async (files: FileList) => {
    if (!files.length || isUploading) return;

    setIsUploading(true);
    try {
      const newAttachments: Attachment[] = [];
      
      for (const file of Array.from(files)) {
        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          toast({
            title: "File Too Large",
            description: `${file.name} is too large. Maximum size is 10MB.`,
            variant: "destructive",
          });
          continue;
        }

        // Validate file type
        const allowedTypes = [
          'image/jpeg', 'image/png', 'image/gif', 'image/webp',
          'application/pdf', 'text/plain', 'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        if (!allowedTypes.includes(file.type)) {
          toast({
            title: "Unsupported File Type",
            description: `${file.name} type is not supported.`,
            variant: "destructive",
          });
          continue;
        }

        const attachment = await uploadFile(file);
        newAttachments.push(attachment);
      }

      setPendingAttachments(prev => [...prev, ...newAttachments]);
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removePendingAttachment = (attachmentId: string) => {
    setPendingAttachments(prev => prev.filter(att => att.id !== attachmentId));
  };

  const sendMessage = async (messageContent?: string) => {
    const content = messageContent || inputMessage.trim();
    if ((!content && pendingAttachments.length === 0) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content || 'Sent attachments',
      timestamp: new Date(),
      attachments: [...pendingAttachments]
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    const currentAttachments = [...pendingAttachments];
    setPendingAttachments([]);
    setIsLoading(true);

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        attachments: msg.attachments
      }));

      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          message: content,
          conversation_history: conversationHistory,
          attachments: currentAttachments
        }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message || 'I apologize, but I encountered an error processing your request.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
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

  const handleVoiceToggle = () => {
    if (!recognition) {
      toast({
        title: "Voice Recognition Unavailable",
        description: "Your browser doesn't support voice recognition.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="border-b border-border p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Budgeting Assistant</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length === 0 && (
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold">Welcome to your Budgeting Assistant! 🤖💰</h3>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      I'm here to help you manage your finances, analyze spending patterns, and achieve your financial goals. Here's what I can help you with:
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                      <li>Analyze your spending patterns and trends</li>
                      <li>Create and manage budgets based on your transaction history</li>
                      <li>Set and track financial goals</li>
                      <li>Provide personalized money-saving recommendations</li>
                      <li>Answer questions about your financial health</li>
                    </ul>
                    <p className="mt-4 text-sm text-muted-foreground">
                      Try asking me something like "How much did I spend on food last month?" or "Help me create a budget"
                    </p>
                  </CardContent>
                </Card>
              )}
              
              {messages.map((message) => (
                <Card key={message.id} className={message.role === 'user' ? 'ml-12' : 'mr-12'}>
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {message.role === 'user' ? 'U' : 'AI'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-1">
                          {message.role === 'user' ? 'You' : 'Budgeting Assistant'}
                        </p>
                        <div className="prose prose-sm max-w-none">
                          <p style={{ whiteSpace: 'pre-wrap' }}>{message.content}</p>
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {message.attachments.map((attachment) => (
                                <div key={attachment.id} className="flex items-center gap-2 p-2 bg-muted rounded-md">
                                  {attachment.type.startsWith('image/') ? (
                                    <div className="flex items-center gap-2">
                                      <Image className="h-4 w-4" />
                                      <img 
                                        src={attachment.url} 
                                        alt={attachment.name}
                                        className="max-w-xs max-h-32 object-contain rounded"
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4" />
                                      <span className="text-sm truncate">{attachment.name}</span>
                                    </div>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => window.open(attachment.url, '_blank')}
                                  >
                                    <Download className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {isLoading && (
                <Card className="mr-12">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                        AI
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-1">Budgeting Assistant</p>
                        <div className="flex items-center space-x-2">
                          <div className="animate-pulse">Thinking...</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>

          <div className="border-t border-border p-4 space-y-4">
            <div className="flex items-center space-x-2 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => sendMessage("Analyze my finances and provide insights")}
                disabled={isLoading}
              >
                📊 Analyze Finances
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={syncTransactions}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Update Recent Transactions
                  </>
                )}
              </Button>
            </div>

            {pendingAttachments.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Attachments:</p>
                <div className="flex flex-wrap gap-2">
                  {pendingAttachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center gap-2 bg-muted p-2 rounded-md">
                      {attachment.type.startsWith('image/') ? (
                        <Image className="h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                      <span className="text-sm truncate max-w-32">{attachment.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePendingAttachment(attachment.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.txt,.doc,.docx"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                className="hidden"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading || isUploading}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                variant={isListening ? "destructive" : "outline"}
                size="icon"
                onClick={handleVoiceToggle}
                disabled={isLoading}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me about your finances..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                onClick={() => sendMessage()} 
                disabled={isLoading || (!inputMessage.trim() && pendingAttachments.length === 0)}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
