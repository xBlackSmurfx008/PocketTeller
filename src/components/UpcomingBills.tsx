import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Plus, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import AddBillDialog from '@/components/AddBillDialog';

interface Bill {
  id: string;
  name: string;
  due_date: string;
  amount: number;
  is_paid: boolean;
}

export default function UpcomingBills() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBills();
    }
  }, [user]);

  const fetchBills = async () => {
    try {
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', user?.id)
        .order('due_date', { ascending: true });

      if (error) throw error;
      setBills(data || []);
    } catch (error) {
      console.error('Error fetching bills:', error);
      toast({
        title: "Error",
        description: "Failed to fetch bills",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBillStatus = async (billId: string, isPaid: boolean) => {
    try {
      const { error } = await supabase
        .from('bills')
        .update({ is_paid: isPaid })
        .eq('id', billId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setBills(prev =>
        prev.map(bill =>
          bill.id === billId ? { ...bill, is_paid: isPaid } : bill
        )
      );

      toast({
        title: "Success",
        description: `Bill marked as ${isPaid ? 'paid' : 'unpaid'}`,
      });
    } catch (error) {
      console.error('Error updating bill:', error);
      toast({
        title: "Error",
        description: "Failed to update bill status",
        variant: "destructive",
      });
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const isDueToday = (dueDate: string) => {
    return new Date(dueDate).toDateString() === new Date().toDateString();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Bills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Bills
          </CardTitle>
          <Button onClick={() => setShowAddDialog(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Bill
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {bills.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No bills found. Add your first bill to get started.
            </div>
          ) : (
            bills.map((bill) => (
              <div key={bill.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={bill.is_paid}
                    onCheckedChange={(checked) => updateBillStatus(bill.id, checked as boolean)}
                  />
                  <div>
                    <div className="font-medium">{bill.name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <span>Due: {format(new Date(bill.due_date), 'MMM dd, yyyy')}</span>
                      {isOverdue(bill.due_date) && !bill.is_paid && (
                        <Badge variant="destructive" className="text-xs">Overdue</Badge>
                      )}
                      {isDueToday(bill.due_date) && !bill.is_paid && (
                        <Badge variant="secondary" className="text-xs">Due Today</Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    ${bill.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  {bill.is_paid && (
                    <Badge variant="default" className="text-xs">Paid</Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>

      <AddBillDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onBillAdded={fetchBills}
      />
    </Card>
  );
}