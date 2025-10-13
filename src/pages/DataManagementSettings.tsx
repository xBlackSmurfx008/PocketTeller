import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, Database, Download, Trash2, HardDrive } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { supabase } from '@/integrations/supabase/client';
import UpcomingBillsSummary from '@/components/UpcomingBillsSummary';

export default function DataManagementSettings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [isClearingCache, setIsClearingCache] = useState(false);

  const exportData = async (format: 'csv' | 'json') => {
    if (!user) return;

    setIsExporting(true);
    try {
      // Export all user data
      const tables = ['budget', 'transactions', 'accounts', 'goals', 'bills'];
      const exportData: any = {};

      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .eq('user_id', user.id);

        if (!error && data) {
          exportData[table] = data;
        }
      }

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pocketteller-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // CSV export for each table
        for (const [tableName, data] of Object.entries(exportData)) {
          if (Array.isArray(data) && data.length > 0) {
            const headers = Object.keys(data[0]);
            const csvContent = [
              headers.join(','),
              ...data.map((row: any) => 
                headers.map(header => 
                  typeof row[header] === 'object' 
                    ? JSON.stringify(row[header]) 
                    : row[header]
                ).join(',')
              )
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pocketteller-${tableName}-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }
        }
      }

      toast({
        title: "Export Complete",
        description: `Your data has been exported in ${format.toUpperCase()} format.`,
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const clearCache = async () => {
    setIsClearingCache(true);
    try {
      // Clear localStorage
      localStorage.clear();
      
      // Clear sessionStorage
      sessionStorage.clear();

      // Clear any cached data in the app
      // This would depend on your caching implementation
      
      toast({
        title: "Cache Cleared",
        description: "All cached data has been cleared.",
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast({
        title: "Cache Clear Failed",
        description: "Failed to clear cache. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsClearingCache(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-4xl mx-auto pt-perfect px-4 pb-4 space-y-6 content-container">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/settings')}
            className="p-2"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Database className="h-6 w-6" />
              Data Management
            </h1>
            <p className="text-muted-foreground">Manage your data and storage</p>
          </div>
        </div>

        {/* Upcoming Bills Summary */}
        <UpcomingBillsSummary />

        {/* Data Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Export Data
            </CardTitle>
            <CardDescription>Download your data in various formats</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                onClick={() => exportData('json')}
                disabled={isExporting}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {isExporting ? "Exporting..." : "Export JSON"}
              </Button>
              <Button
                onClick={() => exportData('csv')}
                disabled={isExporting}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {isExporting ? "Exporting..." : "Export CSV"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              JSON export includes all data in a single file. CSV export creates separate files for each data type.
            </p>
          </CardContent>
        </Card>

        {/* Cache Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Cache Management
            </CardTitle>
            <CardDescription>Manage locally stored data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={clearCache}
              disabled={isClearingCache}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {isClearingCache ? "Clearing..." : "Clear Cache"}
            </Button>
            <p className="text-sm text-muted-foreground">
              This will clear all locally cached data. You may need to sign in again.
            </p>
          </CardContent>
        </Card>

        {/* Data Retention */}
        <Card>
          <CardHeader>
            <CardTitle>Data Retention</CardTitle>
            <CardDescription>Information about how your data is stored</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <p className="font-medium">Transaction Data</p>
              <p className="text-sm text-muted-foreground">
                Transaction history is kept for up to 7 years for tax and record-keeping purposes.
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">Account Data</p>
              <p className="text-sm text-muted-foreground">
                Bank account information is stored securely and can be disconnected at any time.
              </p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">User Preferences</p>
              <p className="text-sm text-muted-foreground">
                App settings and preferences are stored until you delete your account.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
