import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { useBills } from '@/hooks/useBills';
import { Bill } from '@/types/models';
import { format, addDays, isAfter, isBefore } from 'date-fns';

export default function UpcomingBillsSummary() {
  const { bills, loading } = useBills();
  const [upcomingBills, setUpcomingBills] = useState<Bill[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [unpaidCount, setUnpaidCount] = useState(0);

  useEffect(() => {
    if (!bills) return;

    const now = new Date();
    const twoWeeksFromNow = addDays(now, 14);

    // Filter bills due in next 14 days
    const upcoming = bills.filter(bill => {
      if (!bill.due_date || bill.due_date.trim() === '') return false;
      
      const dueDate = new Date(bill.due_date);
      return isAfter(dueDate, now) && isBefore(dueDate, twoWeeksFromNow);
    });

    setUpcomingBills(upcoming);

    // Calculate totals
    const total = upcoming.reduce((sum, bill) => sum + bill.amount, 0);
    setTotalAmount(total);

    const unpaid = upcoming.filter(bill => !bill.is_paid).length;
    setUnpaidCount(unpaid);
  }, [bills]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Bills
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading bills...</p>
        </CardContent>
      </Card>
    );
  }

  if (upcomingBills.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Bills
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No bills due in the next 2 weeks</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Bills (Next 2 Weeks)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm font-medium">Total Due</span>
            </div>
            <p className="text-lg font-bold">
              ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Unpaid</span>
            </div>
            <p className="text-lg font-bold">{unpaidCount}</p>
          </div>
        </div>

        {/* Bills List */}
        <div className="space-y-2">
          {upcomingBills.slice(0, 3).map((bill) => (
            <div key={bill.id} className="flex items-center justify-between p-2 border border-border rounded-lg">
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-medium text-sm">{bill.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Due: {format(new Date(bill.due_date), 'MMM dd')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={bill.is_paid ? "secondary" : "destructive"}>
                  {bill.is_paid ? "Paid" : "Unpaid"}
                </Badge>
                <span className="font-semibold text-sm">
                  ${bill.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        {upcomingBills.length > 3 && (
          <Button variant="outline" className="w-full">
            View All {upcomingBills.length} Bills
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
