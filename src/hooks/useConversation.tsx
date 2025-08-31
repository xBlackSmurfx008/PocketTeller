import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useDemo } from '@/hooks/useDemo';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: FileAttachment[];
}

export interface FileAttachment {
  name: string;
  type: string;
  url: string;
  path?: string;
  status?: 'uploading' | 'ready' | 'failed';
}

export interface EducationSuggestion {
  title: string;
  description: string;
  category: string;
  url: string;
}

export interface GeminiChatResponse {
  response?: string;
  message?: string;
  model?: string;
  timestamp?: string;
  savedToDb?: boolean;
  educationSuggestions?: EducationSuggestion[];
  coach_stage?: string;
  coach_questions?: string[];
  error?: string;
  debug?: {
    processedAttachments: number;
    processedNames: string[];
    skippedAttachments: number;
    attachmentErrors: number;
  };
}

export const useConversation = (threadId?: string) => {
  const { user } = useAuth();
  const { isDemo, usePrompt, useConversation } = useDemo();
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);

  // Load conversation thread
  const loadThread = useCallback(async (id: string) => {
    if (isDemo) return;
    if (!user) return;

    try {
      const { data: threadData } = await supabase
        .from('conversation_threads')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (!threadData) {
        throw new Error('Thread not found');
      }

      const { data: conversations } = await supabase
        .from('conversations')
        .select('*')
        .eq('thread_id', id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      const threadMessages: Message[] = conversations?.map(conv => ({
        id: conv.id,
        role: conv.role as 'user' | 'assistant',
        content: conv.message,
        timestamp: new Date(conv.created_at),
        attachments: parseAttachments(conv.attachments)
      })) || [];

      setMessages(threadMessages);
    } catch (err: any) {
      console.error('Error loading thread:', err);
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to load conversation thread",
        variant: "destructive",
      });
    }
  }, [user, isDemo, toast]);

  // Send message
  const sendMessage = useCallback(async (
    content: string, 
    attachments: FileAttachment[] = [],
    coachMode = false
  ) => {
    if (isDemo && !usePrompt()) {
      toast({
        title: "Demo Limit Reached",
        description: "You've reached the demo message limit. Sign up to continue!",
        variant: "destructive",
      });
      return false;
    }

    setIsLoading(true);
    setError(null);

    // Add user message immediately
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
      attachments
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      // Prepare request data
      const requestData = {
        message: content,
        threadId,
        coachMode,
        attachments: attachments.map(att => ({
          name: att.name,
          type: att.type,
          url: att.url
        }))
      };

      // Call Gemini chat function
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: requestData
      });

      if (error) {
        throw new Error(error.message || 'Failed to get AI response');
      }

      const response = data as GeminiChatResponse;
      const aiContent = response.response || response.message || 'No response received';

      // Add AI response with typewriter effect
      const aiMessageId = `ai-${Date.now()}`;
      const aiMessage: Message = {
        id: aiMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setTypingMessageId(aiMessageId);

      // Simulate typewriter effect
      let currentIndex = 0;
      const typeNextChar = () => {
        if (currentIndex < aiContent.length) {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, content: aiContent.slice(0, currentIndex + 1) }
                : msg
            )
          );
          currentIndex++;
          setTimeout(typeNextChar, 30); // Adjust speed here (30ms per character)
        } else {
          setTypingMessageId(null);
        }
      };

      setTimeout(typeNextChar, 100); // Initial delay

      return {
        success: true,
        response: aiMessage,
        educationSuggestions: response.educationSuggestions,
        coachStage: response.coach_stage,
        coachQuestions: response.coach_questions
      };

    } catch (err: any) {
      console.error('Error sending message:', err);
      const errorMessage = err.message || 'Failed to send message';
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [user, isDemo, usePrompt, threadId, toast]);

  // Clear conversation
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    loadThread,
    typingMessageId
  };
};

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