import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Share2, Copy, Mail, MessageSquare, Download, FileText, FileSpreadsheet, Shield, Lock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ShareBudgetDialogProps {
  budgetData: any;
  children: React.ReactNode;
}

export function ShareBudgetDialog({ budgetData, children }: ShareBudgetDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [senderName, setSenderName] = useState("");
  const [message, setMessage] = useState("");
  const [maxViews, setMaxViews] = useState(10);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const generateShareLink = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Generate a cryptographically secure token using the database function
      const { data: tokenData, error: tokenError } = await supabase
        .rpc('generate_secure_token');
      
      if (tokenError || !tokenData) {
        throw new Error('Failed to generate secure token');
      }
      
      const token = tokenData;
      
      // Create budget share record with security settings
      const { data, error } = await supabase
        .from('budget_shares')
        .insert({
          user_id: user.id,
          token,
          budget_data: budgetData,
          max_views: maxViews,
          requires_auth: requiresAuth
        })
        .select()
        .single();

      if (error) throw error;

      const url = `${window.location.origin}/share/budget/${token}`;
      setShareUrl(url);
      
      toast({
        title: "Share link generated",
        description: "Your budget plan is ready to share!",
      });
    } catch (error) {
      console.error('Error generating share link:', error);
      toast({
        title: "Error",
        description: "Failed to generate share link",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Copied!",
        description: "Share link copied to clipboard",
      });
    }
  };

  const sendEmail = async () => {
    if (!recipientEmail || !shareUrl) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-budget-email', {
        body: {
          recipientEmail,
          shareUrl,
          senderName: senderName || undefined,
          message: message || undefined
        }
      });

      if (error) throw error;

      toast({
        title: "Email sent!",
        description: `Budget plan shared with ${recipientEmail}`,
      });
      setRecipientEmail("");
      setMessage("");
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendSMS = async () => {
    if (!recipientPhone || !shareUrl) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-budget-sms', {
        body: {
          phoneNumber: recipientPhone,
          shareUrl,
          senderName: senderName || undefined,
          message: message || undefined
        }
      });

      if (error) throw error;

      toast({
        title: "SMS sent!",
        description: `Budget plan shared with ${recipientPhone}`,
      });
      setRecipientPhone("");
      setMessage("");
    } catch (error) {
      console.error('Error sending SMS:', error);
      toast({
        title: "Error",
        description: "Failed to send SMS",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportAsJSON = () => {
    const dataStr = JSON.stringify(budgetData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `budget-plan-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Export complete",
      description: "Budget plan exported as JSON",
    });
  };

  const exportAsCSV = () => {
    const csvData = [
      ['Income', budgetData.income || 0],
      ['Expenses', budgetData.expenses || 0],
      ['Net', (budgetData.income || 0) - (budgetData.expenses || 0)],
      ['Time Period', budgetData.time_period || 'monthly']
    ];

    if (budgetData.categories && typeof budgetData.categories === 'object') {
      csvData.push(['', '']);
      csvData.push(['Categories', '']);
      Object.entries(budgetData.categories).forEach(([category, amount]) => {
        csvData.push([category, amount as number]);
      });
    }

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
    const exportFileDefaultName = `budget-plan-${new Date().toISOString().split('T')[0]}.csv`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    toast({
      title: "Export complete",
      description: "Budget plan exported as CSV",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Budget Plan
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="link">Link</TabsTrigger>
            <TabsTrigger value="send">Send</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>
          
          <TabsContent value="link" className="space-y-4">
            {!shareUrl ? (
              <>
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    <Label className="text-sm font-medium">Security Settings</Label>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="max-views">Maximum Views</Label>
                      <Select value={maxViews.toString()} onValueChange={(value) => setMaxViews(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 view</SelectItem>
                          <SelectItem value="5">5 views</SelectItem>
                          <SelectItem value="10">10 views</SelectItem>
                          <SelectItem value="25">25 views</SelectItem>
                          <SelectItem value="50">50 views</SelectItem>
                          <SelectItem value="100">100 views</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        <Label htmlFor="requires-auth" className="text-sm">Require login to view</Label>
                      </div>
                      <Switch
                        id="requires-auth"
                        checked={requiresAuth}
                        onCheckedChange={setRequiresAuth}
                      />
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={generateShareLink} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? "Generating..." : "Generate Secure Share Link"}
                </Button>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="share-url">Share URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="share-url"
                    value={shareUrl}
                    readOnly
                    className="flex-1"
                  />
                  <Button onClick={copyToClipboard} size="icon" variant="outline">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  This link will expire in 7 days
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="send" className="space-y-4">
            {!shareUrl && (
              <Button 
                onClick={generateShareLink} 
                disabled={isLoading}
                className="w-full mb-4"
              >
                {isLoading ? "Generating..." : "Generate Share Link First"}
              </Button>
            )}
            
            {shareUrl && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="sender-name">Your Name (optional)</Label>
                  <Input
                    id="sender-name"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                
                  <div className="space-y-2">
                    <Label htmlFor="message">Message (optional)</Label>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Basic input sanitization for security
                        if (value.length <= 1000 && !/<script|javascript:|data:|vbscript:|on\w+\s*=/i.test(value)) {
                          setMessage(value);
                        }
                      }}
                      placeholder="Add a personal message..."
                      rows={3}
                      maxLength={1000}
                    />
                    <p className="text-xs text-muted-foreground">
                      HTML and script content is not allowed
                    </p>
                  </div>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="flex gap-2">
                      <Input
                        id="email"
                        type="email"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        placeholder="recipient@example.com"
                        className="flex-1"
                      />
                      <Button 
                        onClick={sendEmail} 
                        disabled={!recipientEmail || !shareUrl || isLoading}
                        size="icon"
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">SMS</Label>
                    <div className="flex gap-2">
                      <Input
                        id="phone"
                        type="tel"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        placeholder="+1234567890"
                        className="flex-1"
                      />
                      <Button 
                        onClick={sendSMS} 
                        disabled={!recipientPhone || !shareUrl || isLoading}
                        size="icon"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="export" className="space-y-4">
            <div className="space-y-2">
              <Button 
                onClick={exportAsJSON} 
                className="w-full justify-start"
                variant="outline"
              >
                <FileText className="w-4 h-4 mr-2" />
                Export as JSON
              </Button>
              
              <Button 
                onClick={exportAsCSV} 
                className="w-full justify-start"
                variant="outline"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export as CSV
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Download your budget plan for offline viewing or importing into other applications.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}