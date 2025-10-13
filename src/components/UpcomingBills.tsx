
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useTimezone } from '@/hooks/useTimezone';
import { useDateHelpers } from '@/utils/dateUtils';
import { useToast } from '@/hooks/useToast';
import { useBills } from '@/hooks/useBills';
import { Plus, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import AddBillDialog from '@/components/AddBillDialog';
import { Bill } from '@/types/models';

export default function UpcomingBills() {
  const { timezone } = useTimezone();
  const dateHelpers = useDateHelpers(timezone);
  const { toast } = useToast();
  const { bills, loading, updateBill, refetch } = useBills();
  const [showAddDialog, setShowAddDialog] = useState(false);

  const updateBillStatus = async (billId: string, isPaid: boolean) => {
    await updateBill(billId, { is_paid: isPaid });
  };

  const getBillStatusBadge = (bill: Bill) => {
    if (bill.is_paid) {
      return <Badge variant="default" className="text-xs">Paid</Badge>;
    }

    // Don't show overdue status if there's no valid due_date
    if (!bill.due_date || bill.due_date.trim() === '') {
      return null;
    }

    try {
      const daysUntil = dateHelpers.getDaysUntil(bill.due_date);
      
      if (dateHelpers.isOverdue(bill.due_date)) {
        return <Badge variant="destructive" className="text-xs">Overdue</Badge>;
      } else if (dateHelpers.isDueToday(bill.due_date)) {
        return <Badge variant="secondary" className="text-xs">Due Today</Badge>;
      } else if (daysUntil <= 3 && daysUntil > 0) {
        return <Badge variant="outline" className="text-xs">Due in {daysUntil} day{daysUntil > 1 ? 's' : ''}</Badge>;
      }
    } catch (error) {
      // If date parsing fails, don't show any status badge
      console.warn('Invalid due_date format:', bill.due_date, error);
      return null;
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
            onClick={() => setShowAddDialog(true)} 
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
            (bills || []).map((bill) => (
              <div key={bill.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={bill.is_paid}
                    onCheckedChange={(checked) => updateBillStatus(bill.id, checked as boolean)}
                  />
                  <div>
                    <div className="font-medium">{bill.name}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      {bill.due_date && bill.due_date.trim() !== '' ? (
                        <>
                          <span>Due: {format(new Date(bill.due_date), 'MMM dd, yyyy')}</span>
                          {getBillStatusBadge(bill)}
                        </>
                      ) : (
                        <span className="text-muted-foreground">No due date set</span>
                      )}
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
        onBillAdded={() => refetch()}
      />
    </Card>
  );
}
