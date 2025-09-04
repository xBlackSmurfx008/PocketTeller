import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Mail, Building2, Phone, MessageCircle } from "lucide-react";

interface ContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: "demo" | "quote" | "consultation" | "general";
  defaultSubject?: string;
}

export function ContactDialog({ 
  open, 
  onOpenChange, 
  defaultType = "general",
  defaultSubject = "" 
}: ContactDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organization: "",
    phone: "",
    inquiryType: defaultType,
    subject: defaultSubject,
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate form submission - in real app, this would call an API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Thank you for your inquiry! We'll get back to you within 24 hours.", {
        description: "Check your email for a confirmation."
      });
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        organization: "",
        phone: "",
        inquiryType: "general",
        subject: "",
        message: "",
      });
      
      onOpenChange(false);
    } catch (error) {
      toast.error("Something went wrong. Please try again or email us directly.", {
        description: "hello@pocketbanker.ai"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeIcon = () => {
    switch (formData.inquiryType) {
      case "demo": return <Building2 className="w-4 h-4" />;
      case "quote": return <Phone className="w-4 h-4" />;
      case "consultation": return <MessageCircle className="w-4 h-4" />;
      default: return <Mail className="w-4 h-4" />;
    }
  };

  const getTypeLabel = () => {
    switch (formData.inquiryType) {
      case "demo": return "Schedule a Demo";
      case "quote": return "Request a Quote";
      case "consultation": return "Free Consultation";
      default: return "General Inquiry";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTypeIcon()}
            {getTypeLabel()}
          </DialogTitle>
          <DialogDescription>
            Get in touch with our team. We'll respond within 24 hours.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                placeholder="Your full name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="organization">Organization</Label>
              <Input
                id="organization"
                value={formData.organization}
                onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                placeholder="Your organization name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inquiryType">Inquiry Type</Label>
            <Select 
              value={formData.inquiryType} 
              onValueChange={(value: "demo" | "quote" | "consultation" | "general" | "partnership" | "support") => 
                setFormData(prev => ({ ...prev, inquiryType: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="demo">Schedule a Demo</SelectItem>
                <SelectItem value="quote">Request a Quote</SelectItem>
                <SelectItem value="consultation">Free Consultation</SelectItem>
                <SelectItem value="partnership">Partnership Inquiry</SelectItem>
                <SelectItem value="support">Technical Support</SelectItem>
                <SelectItem value="general">General Question</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              placeholder="Brief description of your inquiry"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
              required
              placeholder="Tell us more about your needs, timeline, and any specific questions..."
              rows={4}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}