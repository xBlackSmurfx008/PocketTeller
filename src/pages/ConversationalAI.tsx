import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Send, Plus, Upload, X, GraduationCap } from "lucide-react";

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
  status?: 'uploading' | 'ready' | 'failed';
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [coachMode, setCoachMode] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date(),
      attachments: attachments.length > 0 ? [...attachments] : undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setAttachments([]);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('gemini-chat', {
        body: {
          message: inputMessage,
          conversation_history: messages.map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          attachments: attachments,
          thread_id: threadId,
          coach_mode: coachMode
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
      const fileId = `${Date.now()}-${file.name}`;
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
      const fileId = `${Date.now()}-${file.name}`;
      
      // Skip if validation failed
      if (!optimisticAttachments.find(a => a.name === file.name)) continue;

      try {
        // Upload to Supabase Storage
        const filePath = `${user.id}/${Date.now()}-${file.name}`;
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

        // Update attachment status to ready
        setAttachments(prev => prev.map(attachment => 
          attachment.name === file.name && attachment.status === 'uploading'
            ? { ...attachment, url: signedUrlData?.signedUrl || filePath, status: 'ready' as const }
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
  }, [messages]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-4">
        {/* Header with New Conversation and Coach Mode */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-foreground">AI Financial Assistant</h1>
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

        {coachMode && (
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

        {/* Messages Display */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <ScrollArea className="h-[400px] pr-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`mb-2 flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`rounded-lg p-3 max-w-[80%] ${msg.role === 'user' ? 'bg-secondary text-secondary-foreground' : 'bg-muted'}`}>
                    <p className="text-sm whitespace-pre-line">{msg.content}</p>
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2">
                        {msg.attachments.map((attachment, index) => (
                          <div key={index} className="text-xs text-blue-500 underline">
                            <a href={attachment.url} target="_blank" rel="noopener noreferrer">{attachment.name}</a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {msg.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Input Area */}
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Type your message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            className="flex-grow"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
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
            id="file-upload"
            type="file"
            multiple
            accept="image/*,.pdf,.txt,.csv,.json,.md,.log,text/*,audio/*,video/*,.doc,.docx,.xls,.xlsx"
            onChange={handleFileUpload}
            className="sr-only"
            ref={fileInputRef}
          />
        </div>

        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="mt-4">
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
    </div>
  );
};

export default ConversationalAI;
