import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Upload, X, Loader2 } from 'lucide-react';
import { FileAttachment } from '@/hooks/useConversation';
import { useFileUpload } from '@/hooks/useFileUpload';

interface MessageInputProps {
  onSendMessage: (message: string, attachments: FileAttachment[], coachMode: boolean) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export const MessageInput = ({ onSendMessage, isLoading, disabled }: MessageInputProps) => {
  const [inputMessage, setInputMessage] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [coachMode, setCoachMode] = useState(false);
  const { uploadFiles, isUploading } = useFileUpload();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim() && attachments.length === 0) return;
    if (isLoading || disabled) return;

    onSendMessage(inputMessage.trim(), attachments, coachMode);
    setInputMessage('');
    setAttachments([]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const uploadedAttachments = await uploadFiles(files);
    setAttachments(prev => [...prev, ...uploadedAttachments]);
    
    // Reset input
    e.target.value = '';
  };

  const removeAttachment = (indexToRemove: number) => {
    setAttachments(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <Card className="border-t">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Ask your AI Assistant</CardTitle>
            <CardDescription>
              Upload files or ask questions about your finances
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="coach-mode"
              checked={coachMode}
              onCheckedChange={setCoachMode}
            />
            <Label htmlFor="coach-mode" className="text-sm">
              Coach Mode
            </Label>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* File Attachments */}
        {attachments.length > 0 && (
          <div className="mb-4 space-y-2">
            <Label className="text-sm font-medium">Attachments</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {attachments.map((attachment, index) => (
                <div key={index} className="relative">
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                    <div className="w-8 h-8 bg-background rounded flex items-center justify-center text-xs">
                      📄
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{attachment.name}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(index)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask me anything about your finances..."
                disabled={isLoading || disabled}
                className="min-h-[80px] resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Input
                type="file"
                onChange={handleFileUpload}
                multiple
                accept="image/*,.pdf,.txt,.json"
                className="hidden"
                id="file-upload"
                disabled={isUploading || isLoading || disabled}
              />
              <Label htmlFor="file-upload" className="cursor-pointer">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploading || isLoading || disabled}
                  asChild
                >
                  <span>
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    Upload Files
                  </span>
                </Button>
              </Label>
            </div>

            <Button
              type="submit"
              disabled={
                (!inputMessage.trim() && attachments.length === 0) ||
                isLoading ||
                disabled ||
                isUploading
              }
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};