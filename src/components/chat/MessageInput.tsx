import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Upload, X, Loader2, HelpCircle, GraduationCap } from 'lucide-react';
import { FileAttachment } from '@/hooks/useConversation';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useToast } from '@/hooks/useToast';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

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
  const { toast } = useToast();
  const [showCoachModeInfo, setShowCoachModeInfo] = useState(false);

  const handleCoachModeChange = (checked: boolean) => {
    setCoachMode(checked);
    if (checked) {
      toast({
        title: '🎓 Coach Mode Activated',
        description: "I'll guide you with deeper questions and a structured coaching framework.",
      });
      const hasSeen = typeof window !== 'undefined' && localStorage.getItem('hasSeenCoachModeInfo');
      if (!hasSeen) {
        setShowCoachModeInfo(true);
      }
    } else {
      toast({
        title: 'Coach Mode Off',
        description: 'Returning to direct answers without coaching prompts.',
      });
    }
  };

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
            <CardTitle className={cn('text-lg', coachMode && 'text-primary')}>
              {coachMode ? '🎓 AI Coach Ready' : 'Ask your AI Assistant'}
            </CardTitle>
            <CardDescription>
              {coachMode
                ? "I'll guide you with coaching questions and structured frameworks"
                : 'Upload files or ask questions about your finances'}
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="coach-mode"
              checked={coachMode}
              onCheckedChange={handleCoachModeChange}
            />
            <Label htmlFor="coach-mode" className="text-sm flex items-center gap-1">
              Coach Mode
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" aria-label="Coach Mode info" className="text-muted-foreground">
                    <HelpCircle className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-semibold mb-1">Enhanced Coaching</p>
                  <p className="text-xs">
                    Activates Socratic questions, step-by-step guidance, and a 6-stage coaching framework.
                  </p>
                </TooltipContent>
              </Tooltip>
            </Label>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {coachMode && (
          <Alert className="mb-4">
            <GraduationCap className="h-4 w-4" />
            <AlertTitle>Coach Mode Active</AlertTitle>
            <AlertDescription className="text-xs">
              I will use coaching questions and a structured process to help you create an action plan.
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 ml-2"
                type="button"
                onClick={() => setShowCoachModeInfo(true)}
              >
                Learn more
              </Button>
            </AlertDescription>
          </Alert>
        )}
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
                placeholder={coachMode ? 'Ask about your goals, challenges, or habits…' : 'Ask me anything about your finances...'}
                disabled={isLoading || disabled}
                className={cn('min-h-[80px] resize-none', coachMode && 'border-2 border-primary')}
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
      <Dialog open={showCoachModeInfo} onOpenChange={setShowCoachModeInfo}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <GraduationCap className="h-6 w-6 text-primary" />
              Welcome to Coach Mode
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertTitle>What changes?</AlertTitle>
              <AlertDescription>
                Coach Mode turns your assistant into an intensive financial coach using Socratic questions and a structured 6-stage framework: Assess → Clarify → Explore → Plan → Commit → Review.
              </AlertDescription>
            </Alert>
            <div className="grid gap-3 text-sm">
              <div>
                <p className="font-semibold">Socratic Questions</p>
                <p className="text-muted-foreground">Thoughtful prompts that help you discover insights yourself.</p>
              </div>
              <div>
                <p className="font-semibold">Step-by-Step Guidance</p>
                <p className="text-muted-foreground">Complex topics are broken into clear, actionable steps.</p>
              </div>
              <div>
                <p className="font-semibold">Accountability</p>
                <p className="text-muted-foreground">We’ll set commitments and check confidence before actions.</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => {
                try {
                  localStorage.setItem('hasSeenCoachModeInfo', 'true');
                } catch {
                  // Ignore localStorage errors
                }
                setShowCoachModeInfo(false);
              }}
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};