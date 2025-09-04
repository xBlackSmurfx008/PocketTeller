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
  const { isDemo, usePrompt, useConversation, sampleData } = useDemo();
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
      let aiContent: string;
      let response: GeminiChatResponse;

      if (isDemo) {
        // Use demo data for AI responses
        aiContent = getDemoResponse(content, sampleData);
        response = {
          response: aiContent,
          educationSuggestions: [
            {
              title: "Budgeting Basics",
              description: "Learn the fundamentals of creating and maintaining a budget",
              category: "budgeting",
              url: "https://example.com/budgeting-basics"
            }
          ]
        };
      } else {
        // Prepare request data for real API call
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

        response = data as GeminiChatResponse;
        aiContent = response.response || response.message || 'No response received';
      }

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

// Demo response generator that references sample data
const getDemoResponse = (userMessage: string, sampleData: any): string => {
  const message = userMessage.toLowerCase();
  
  // Calculate demo account totals
  const totalBalance = sampleData.accounts?.reduce((sum: number, acc: any) => sum + acc.balance, 0) || 8750;
  const totalExpenses = sampleData.transactions?.filter((t: any) => t.amount < 0)
    .reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0) || 3420.50;
  const monthlyIncome = 5200; // Demo income
  
  // Spending patterns
  if (message.includes('spending') || message.includes('expense')) {
    return `Looking at your demo account, I can see you've spent $${totalExpenses.toFixed(2)} this month. Your largest expense categories are groceries ($${sampleData.transactions?.find((t: any) => t.category === 'groceries')?.amount ? Math.abs(sampleData.transactions.find((t: any) => t.category === 'groceries').amount).toFixed(2) : '450.30'}) and utilities. Your spending seems well-controlled relative to your $${monthlyIncome} monthly income.`;
  }
  
  // Budget questions
  if (message.includes('budget')) {
    const savingsRate = ((monthlyIncome - totalExpenses) / monthlyIncome * 100).toFixed(1);
    return `Based on your demo account data, you're currently saving ${savingsRate}% of your income ($${(monthlyIncome - totalExpenses).toFixed(2)} out of $${monthlyIncome}). I recommend following the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings. You're doing well with your current pattern!`;
  }
  
  // Account balance questions
  if (message.includes('balance') || message.includes('account')) {
    return `Your demo accounts show a total balance of $${totalBalance.toFixed(2)} across ${sampleData.accounts?.length || 2} accounts. Your checking account has $${sampleData.accounts?.[0]?.balance?.toFixed(2) || '3250.00'} and your savings account has $${sampleData.accounts?.[1]?.balance?.toFixed(2) || '5500.00'}.`;
  }
  
  // Goals questions
  if (message.includes('goal')) {
    const emergencyGoal = sampleData.goals?.find((g: any) => g.title.includes('Emergency'));
    const vacationGoal = sampleData.goals?.find((g: any) => g.title.includes('Vacation'));
    return `You have 2 active goals in your demo account. Your Emergency Fund goal is ${emergencyGoal ? ((emergencyGoal.current_amount / emergencyGoal.target_amount) * 100).toFixed(1) : '35'}% complete ($${emergencyGoal?.current_amount || 3500} of $${emergencyGoal?.target_amount || 10000}), and your Vacation to Europe goal is ${vacationGoal ? ((vacationGoal.current_amount / vacationGoal.target_amount) * 100).toFixed(1) : '24'}% complete ($${vacationGoal?.current_amount || 1200} of $${vacationGoal?.target_amount || 5000}).`;
  }
  
  // Bills questions
  if (message.includes('bill') || message.includes('due')) {
    const upcomingBills = sampleData.bills?.filter((b: any) => !b.is_paid) || [];
    return `You have ${upcomingBills.length} upcoming bills in your demo account. Your Electric Bill ($${upcomingBills[0]?.amount || 120.50}) is due in 5 days, and your Internet bill ($${upcomingBills[1]?.amount || 79.99}) is due in 12 days. Total upcoming bills: $${upcomingBills.reduce((sum: number, b: any) => sum + b.amount, 0).toFixed(2)}.`;
  }
  
  // Default helpful response
  return `I'm here to help you with your finances! In your demo account, I can see you have $${totalBalance.toFixed(2)} total balance, ${sampleData.goals?.length || 2} financial goals, and ${sampleData.bills?.length || 2} upcoming bills. You can ask me about your spending patterns, budgeting advice, account balances, or financial goals. What specific aspect of your finances would you like to discuss?`;
};