import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface AddBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBillAdded: () => void;
}

export default function AddBillDialog({
  open,
  onOpenChange,
  onBillAdded,
}: AddBillDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    due_date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      due_date: new Date().toISOString().split('T')[0],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('bills')
        .insert({
          user_id: user?.id,
          name: formData.name,
          amount: parseFloat(formData.amount),
          due_date: formData.due_date,
          is_paid: false,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Bill added successfully",
      });

      resetForm();
      onOpenChange(false);
      onBillAdded();
    } catch (error) {
      console.error('Error adding bill:', error);
      toast({
        title: "Error",
        description: "Failed to add bill",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Bill</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Bill Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter bill name (e.g., Electric Bill, Rent)"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="Enter bill amount"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Due Date</Label>
            <Input
              id="due_date"
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
              required
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Adding..." : "Add Bill"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}