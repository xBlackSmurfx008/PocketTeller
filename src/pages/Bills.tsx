import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useTimezone } from '@/hooks/useTimezone';
import { useDateHelpers } from '@/utils/dateUtils';
import { useToast } from '@/hooks/useToast';
import { useBills } from '@/hooks/useBills';
import { Plus, Calendar, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { Bill } from '@/types/models';

export default function Bills() {
  const { timezone } = useTimezone();
  const dateHelpers = useDateHelpers(timezone);
  const { toast } = useToast();
  const { bills, loading, updateBill, deleteBill, refetch } = useBills();
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [showPaidBills, setShowPaidBills] = useState(false);
  
  // Filter bills based on paid status
  const filteredBills = bills?.filter(bill => showPaidBills ? bill.is_paid : !bill.is_paid) || [];
  
  const updateBillStatus = async (billId: string, isPaid: boolean) => {
    await updateBill(billId, { is_paid: isPaid });
  };

  const handleDeleteBill = async (billId: string) => {
    if (window.confirm('Are you sure you want to delete this bill?')) {
      await deleteBill(billId);
    }
  };

  const getBillStatusBadge = (bill: Bill) => {
    if (bill.is_paid) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Paid</Badge>;
    }
    
    const today = new Date();
    const dueDate = bill.due_date ? new Date(bill.due_date) : null;
    
    if (!dueDate) {
      return <Badge variant="outline">No due date</Badge>;
    }
    
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) {
      return <Badge variant="destructive">Overdue</Badge>;
    } else if (daysUntilDue <= 3) {
      return <Badge variant="destructive">Due Soon</Badge>;
    } else if (daysUntilDue <= 7) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Due This Week</Badge>;
    } else {
      return <Badge variant="outline">Upcoming</Badge>;
    }
  };

  return (
    <div className="bg-background">
      <main className="max-w-7xl mx-auto space-y-4 sm:space-y-6 pt-perfect px-4 pb-4 content-container">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bills Management</h1>
            <p className="text-muted-foreground">Manage all your bills and track payments</p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Bill
          </Button>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-4">
          <Button
            variant={showPaidBills ? "outline" : "default"}
            onClick={() => setShowPaidBills(false)}
            size="sm"
          >
            <Eye className="h-4 w-4 mr-2" />
            Upcoming Bills
          </Button>
          <Button
            variant={showPaidBills ? "default" : "outline"}
            onClick={() => setShowPaidBills(true)}
            size="sm"
          >
            <EyeOff className="h-4 w-4 mr-2" />
            Paid Bills
          </Button>
        </div>

        {/* Bills List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {showPaidBills ? 'Paid Bills' : 'Upcoming Bills'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading bills...</p>
                </div>
              ) : filteredBills.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {showPaidBills ? 'No paid bills found' : 'No upcoming bills found'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {showPaidBills ? 'Switch to upcoming bills or add a new bill' : 'Add your first bill to get started'}
                  </p>
                </div>
              ) : (
                filteredBills.map((bill) => (
                  <div key={bill.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={bill.is_paid}
                        onCheckedChange={(checked) => updateBillStatus(bill.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <div className="font-medium text-lg">{bill.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                          {bill.due_date && bill.due_date.trim() !== '' ? (
                            <>
                              <span>Due: {format(new Date(bill.due_date), 'MMM dd, yyyy')}</span>
                              {getBillStatusBadge(bill)}
                            </>
                          ) : (
                            <span className="text-muted-foreground">No due date set</span>
                          )}
                        </div>
                        {bill.description && (
                          <div className="text-sm text-muted-foreground mt-1">{bill.description}</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-semibold text-lg">
                          ${bill.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        {bill.category && (
                          <div className="text-sm text-muted-foreground">{bill.category}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingBill(bill)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteBill(bill.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
