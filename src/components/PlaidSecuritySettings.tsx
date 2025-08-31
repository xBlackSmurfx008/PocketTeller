
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, RefreshCw, Eye, AlertTriangle, CheckCircle2, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface AuditLog {
  id: string;
  access_type: string;
  function_name: string;
  ip_address: string | null;
  user_agent: string;
  success: boolean;
  error_message?: string;
  created_at: string;
}

interface SecuritySettings {
  security_alerts_enabled: boolean;
  token_access_count: number;
  last_suspicious_access_at?: string;
  last_token_rotation?: string;
  has_plaid_connection: boolean;
}

export const PlaidSecuritySettings = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRotating, setIsRotating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      // Fetch audit logs
      const { data: logs, error: logsError } = await supabase
        .from('plaid_token_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (logsError) throw logsError;
      setAuditLogs((logs || []) as AuditLog[]);

      // Fetch security settings using secure function
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data: profile, error: profileError } = await supabase
        .rpc('get_secure_profile', { target_user_id: user.user.id });

      if (profileError) throw profileError;
      setSecuritySettings(profile?.[0] || null);

    } catch (error) {
      console.error('Error fetching security data:', error);
      toast({
        title: "Error",
        description: `Failed to load security information: ${(error as Error)?.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRotateToken = async () => {
    setIsRotating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .rpc('rotate_plaid_token', { target_user_id: user.id });

      if (error) throw error;

      if (data) {
        toast({
          title: "Success",
          description: "Plaid token rotated successfully. You will need to reconnect your bank account.",
        });
        fetchSecurityData();
      } else {
        toast({
          title: "Error",
          description: "Failed to rotate token",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error rotating token:', error);
      toast({
        title: "Error", 
        description: "Failed to rotate token",
        variant: "destructive",
      });
    } finally {
      setIsRotating(false);
    }
  };

  const toggleSecurityAlerts = async (enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ security_alerts_enabled: enabled })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id);

      if (error) throw error;

      setSecuritySettings(prev => prev ? { ...prev, security_alerts_enabled: enabled } : null);
      toast({
        title: "Success",
        description: `Security alerts ${enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error updating security alerts:', error);
      toast({
        title: "Error",
        description: "Failed to update security alerts",
        variant: "destructive",
      });
    }
  };

  const clearAuditLogs = async () => {
    try {
      const { data, error } = await supabase.rpc('clear_user_audit_logs');

      if (error) throw error;

      setAuditLogs([]);
      toast({
        title: "Success",
        description: "Audit logs cleared successfully",
      });
    } catch (error) {
      console.error('Error clearing audit logs:', error);
      toast({
        title: "Error",
        description: "Failed to clear audit logs",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getAccessTypeBadge = (accessType: string, success: boolean) => {
    if (!success) {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Failed {accessType}
      </Badge>;
    }

    switch (accessType) {
      case 'encrypt':
        return <Badge variant="default" className="flex items-center gap-1">
          <Shield className="h-3 w-3" />
          Token Stored
        </Badge>;
      case 'decrypt':
        return <Badge variant="secondary" className="flex items-center gap-1">
          <Eye className="h-3 w-3" />
          Token Used
        </Badge>;
      case 'rotate':
        return <Badge variant="outline" className="flex items-center gap-1">
          <RefreshCw className="h-3 w-3" />
          Token Rotated
        </Badge>;
      default:
        return <Badge variant="secondary">{accessType}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Plaid Security
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading security information...</div>
        </CardContent>
      </Card>
    );
  }

  // Don't show security settings if no Plaid connection exists
  if (!securitySettings?.has_plaid_connection) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Settings
          </CardTitle>
          <CardDescription>
            Manage your Plaid connection security and monitoring
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="security-alerts">Security Alerts</Label>
              <div className="text-sm text-muted-foreground">
                Get notified of suspicious token access attempts
              </div>
            </div>
            <Switch
              id="security-alerts"
              checked={securitySettings?.security_alerts_enabled || false}
              onCheckedChange={toggleSecurityAlerts}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Total Token Access</Label>
              <div className="text-2xl font-bold">{securitySettings?.token_access_count || 0}</div>
            </div>
            <div>
              <Label className="text-sm font-medium">Last Token Rotation</Label>
              <div className="text-sm text-muted-foreground">
                {securitySettings?.last_token_rotation 
                  ? formatDate(securitySettings.last_token_rotation)
                  : 'Never'
                }
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button 
              onClick={handleRotateToken} 
              disabled={isRotating}
              variant="outline"
              className="w-full"
            >
              {isRotating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Rotating Token...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Rotate Plaid Token
                </>
              )}
            </Button>
            <div className="text-xs text-muted-foreground mt-2">
              This will invalidate your current token and require reconnecting your bank account
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Token Activity</CardTitle>
              <CardDescription>
                Monitor access to your encrypted Plaid tokens
              </CardDescription>
            </div>
            {auditLogs.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Logs
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear Audit Logs?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all token access logs. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={clearAuditLogs}>
                      Clear Logs
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {auditLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No token activity recorded yet
              </div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getAccessTypeBadge(log.access_type, log.success)}
                    <div>
                      <div className="font-medium">{log.function_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(log.created_at)} • IP: {log.ip_address || 'Unknown'}
                      </div>
                      {log.error_message && (
                        <div className="text-sm text-red-600 mt-1">
                          Error: {log.error_message}
                        </div>
                      )}
                    </div>
                  </div>
                  {log.success ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
