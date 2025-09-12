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
  isTyping?: boolean;
}

export const MessageBubble = ({ message, onRemoveAttachment, isTyping = false }: MessageBubbleProps) => {
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
          <MessageContent content={message.content} isTyping={isTyping} />
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
  isTyping?: boolean;
}

const MessageContent = ({ content, isTyping = false }: MessageContentProps) => {
  // If typing, show plain text with cursor
  if (isTyping) {
    return (
      <span className="inline-flex items-center">
        {content}
        <span className="inline-block w-2 h-5 bg-current ml-1 animate-pulse" />
      </span>
    );
  }
  
  // Auto-structure the content for better readability
  const structuredContent = structureContent(content);
  
  return (
    <div className="space-y-3">
      {structuredContent.map((section, index) => (
        <div key={index} className="leading-relaxed">
          {section}
        </div>
      ))}
    </div>
  );
};

// Helper function to structure content into readable paragraphs and lists
const structureContent = (content: string): React.ReactNode[] => {
  const sections: React.ReactNode[] = [];
  const lines = content.split('\n').filter(line => line.trim() !== '');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines
    if (!line) continue;
    
    // Check if line looks like a list item (starts with bullet points or numbers)
    if (line.match(/^[-•*]\s/) || line.match(/^\d+\.\s/)) {
      // Collect consecutive list items
      const listItems: string[] = [line];
      let j = i + 1;
      
      while (j < lines.length) {
        const nextLine = lines[j].trim();
        if (nextLine.match(/^[-•*]\s/) || nextLine.match(/^\d+\.\s/)) {
          listItems.push(nextLine);
          j++;
        } else {
          break;
        }
      }
      
      // Create list element
      sections.push(
        <ul className="space-y-1 pl-4">
          {listItems.map((item, idx) => (
            <li key={idx} className="text-sm">
              {item.replace(/^[-•*]\s/, '').replace(/^\d+\.\s/, '')}
            </li>
          ))}
        </ul>
      );
      
      i = j - 1; // Skip processed lines
    } else {
      // Regular paragraph - split long sentences for better readability
      const sentences = line.split(/[.!?]+/).filter(s => s.trim() !== '');
      
      if (sentences.length > 2 && line.length > 150) {
        // Split into multiple paragraphs for very long content
        const midPoint = Math.ceil(sentences.length / 2);
        const firstHalf = sentences.slice(0, midPoint).join('. ') + '.';
        const secondHalf = sentences.slice(midPoint).join('. ') + '.';
        
        sections.push(
          <p className="text-sm">{firstHalf}</p>
        );
        sections.push(
          <p className="text-sm">{secondHalf}</p>
        );
      } else {
        sections.push(
          <p className="text-sm">{line}</p>
        );
      }
    }
  }
  
  return sections.length > 0 ? sections : [<p className="text-sm">{content}</p>];
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