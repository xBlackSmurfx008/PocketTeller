import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { Message, FileAttachment } from '@/hooks/useConversation';
import aiAvatar from '@/assets/ai-avatar.png';

interface MessageBubbleProps {
  message: Message;
  onRemoveAttachment?: (attachment: FileAttachment) => void;
}

export const MessageBubble = ({ message, onRemoveAttachment }: MessageBubbleProps) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <Avatar className="w-8 h-8 flex-shrink-0">
        {isUser ? (
          <AvatarFallback className="bg-primary text-primary-foreground">
            U
          </AvatarFallback>
        ) : (
          <AvatarImage src={aiAvatar} alt="AI Assistant" />
        )}
      </Avatar>
      
      <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-2 ${
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          <MessageContent content={message.content} />
        </div>
        
        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.attachments.map((attachment, index) => (
              <AttachmentPreview
                key={index}
                attachment={attachment}
                onRemove={onRemoveAttachment}
                showRemoveButton={isUser}
              />
            ))}
          </div>
        )}
        
        <span className="text-xs text-muted-foreground mt-1">
          {message.timestamp.toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
};

interface MessageContentProps {
  content: string;
}

const MessageContent = ({ content }: MessageContentProps) => {
  // Split by lines and process each line
  const lines = content.split('\n');
  const processedLines: React.ReactNode[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Skip empty lines but preserve spacing
    if (line.trim() === '') {
      processedLines.push(<br key={i} />);
      continue;
    }
    
    // Process formatting
    const parts: React.ReactNode[] = [];
    let remaining = line;
    let partKey = 0;
    
    // Handle bold text
    while (remaining.includes('**')) {
      const boldStart = remaining.indexOf('**');
      const boldEnd = remaining.indexOf('**', boldStart + 2);
      
      if (boldEnd === -1) break;
      
      // Add text before bold
      if (boldStart > 0) {
        parts.push(<span key={partKey++}>{remaining.substring(0, boldStart)}</span>);
      }
      
      // Add bold text
      const boldText = remaining.substring(boldStart + 2, boldEnd);
      parts.push(<strong key={partKey++}>{boldText}</strong>);
      
      remaining = remaining.substring(boldEnd + 2);
    }
    
    // Add remaining text
    if (remaining) {
      parts.push(<span key={partKey++}>{remaining}</span>);
    }
    
    processedLines.push(
      <div key={i} className="leading-relaxed">
        {parts.length > 0 ? parts : line}
      </div>
    );
  }
  
  return <>{processedLines}</>;
};

interface AttachmentPreviewProps {
  attachment: FileAttachment;
  onRemove?: (attachment: FileAttachment) => void;
  showRemoveButton?: boolean;
}

const AttachmentPreview = ({ attachment, onRemove, showRemoveButton }: AttachmentPreviewProps) => {
  const isImage = attachment.type.startsWith('image/');
  
  return (
    <div className="relative inline-block">
      <div className="flex items-center gap-2 p-2 bg-background border rounded-lg">
        {isImage ? (
          <img
            src={attachment.url}
            alt={attachment.name}
            className="w-12 h-12 object-cover rounded"
          />
        ) : (
          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
            📄
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{attachment.name}</p>
          <Badge variant="secondary" className="text-xs">
            {attachment.status || 'ready'}
          </Badge>
        </div>
        
        {showRemoveButton && onRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(attachment)}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};