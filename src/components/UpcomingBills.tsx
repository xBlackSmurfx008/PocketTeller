
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDemo } from '@/hooks/useDemo';
import { useTimezone } from '@/hooks/useTimezone';
import { useDateHelpers } from '@/utils/dateUtils';
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
  const { isDemo, sampleData } = useDemo();
  const { timezone } = useTimezone();
  const dateHelpers = useDateHelpers(timezone);
  const { toast } = useToast();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    if (isDemo) {
      setBills(sampleData.bills.map(bill => ({ ...bill, is_paid: false })) as Bill[]);
      setLoading(false);
    } else if (user) {
      fetchBills();
    }
  }, [user, isDemo, sampleData]);

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
    if (isDemo) {
      setBills(prev =>
        prev.map(bill =>
          bill.id === billId ? { ...bill, is_paid: isPaid } : bill
        )
      );
      toast({
        title: "Demo Mode",
        description: `Bill marked as ${isPaid ? 'paid' : 'unpaid'} (demo only)`,
      });
      return;
    }

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

  const getBillStatusBadge = (bill: Bill) => {
    if (bill.is_paid) {
      return <Badge variant="default" className="text-xs">Paid</Badge>;
    }

    const daysUntil = dateHelpers.getDaysUntil(bill.due_date);
    
    if (dateHelpers.isOverdue(bill.due_date)) {
      return <Badge variant="destructive" className="text-xs">Overdue</Badge>;
    } else if (dateHelpers.isDueToday(bill.due_date)) {
      return <Badge variant="secondary" className="text-xs">Due Today</Badge>;
    } else if (daysUntil <= 3 && daysUntil > 0) {
      return <Badge variant="outline" className="text-xs">Due in {daysUntil} day{daysUntil > 1 ? 's' : ''}</Badge>;
    }
    
    return null;
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
          <Button 
            onClick={() => isDemo ? toast({ title: "Demo Mode", description: "Adding bills disabled in demo" }) : setShowAddDialog(true)} 
            size="sm"
          >
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
                      {getBillStatusBadge(bill)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    ${bill.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
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
