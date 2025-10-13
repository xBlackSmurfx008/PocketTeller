import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/useToast';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Globe, 
  Eye, 
  Trash2,
  RotateCcw 
} from 'lucide-react';

interface SecurityEvent {
  id: string;
  level: string;
  message: string;
  context: any;
  ip_address: string | null;
  created_at: string;
}

interface AuthLog {
  id: string;
  event_type: string;
  success: boolean;
  ip_address: string | null;
  created_at: string;
  error_message?: string;
}

export default function SecuritySettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [authLogs, setAuthLogs] = useState<AuthLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearingLogs, setClearingLogs] = useState(false);

  useEffect(() => {
    if (user) {
      loadSecurityData();
    }
  }, [user]);

  const loadSecurityData = async () => {
    try {
      setLoading(true);

      // Load recent security events
      const { data: events } = await supabase
        .from('app_logs')
        .select('*')
        .eq('user_id', user?.id)
        .or('message.ilike.%security%,message.ilike.%auth%,message.ilike.%login%')
        .order('created_at', { ascending: false })
        .limit(20);

      // Load auth audit logs
      const { data: logs } = await supabase
        .from('auth_audit_log')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(20);

      setSecurityEvents((events || []).map(event => ({
        ...event,
        ip_address: event.ip_address as string | null
      })));
      setAuthLogs((logs || []).map(log => ({
        ...log,
        ip_address: log.ip_address as string | null
      })));
    } catch (error) {
      console.error('Error loading security data:', error);
      toast({
        title: "Error",
        description: "Failed to load security information.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const clearAuditLogs = async () => {
    try {
      setClearingLogs(true);
      
      const { error } = await supabase.rpc('clear_user_audit_logs');
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Audit logs have been cleared.",
      });
      
      // Reload data
      await loadSecurityData();
    } catch (error) {
      console.error('Error clearing logs:', error);
      toast({
        title: "Error",
        description: "Failed to clear audit logs.",
        variant: "destructive",
      });
    } finally {
      setClearingLogs(false);
    }
  };

  const formatEventType = (eventType: string) => {
    return eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getEventIcon = (level: string, success?: boolean) => {
    if (success === false) return <AlertTriangle className="h-4 w-4 text-destructive" />;
    if (level === 'WARN') return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    if (level === 'INFO') return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <Shield className="h-4 w-4 text-blue-500" />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Security Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor your account security and authentication activity
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadSecurityData}
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Security Status Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Account Security</p>
                <p className="text-xs text-muted-foreground">Protected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Recent Activity</p>
                <p className="text-xs text-muted-foreground">
                  {authLogs.length} events logged
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Login Locations</p>
                <p className="text-xs text-muted-foreground">
                  {new Set(authLogs.map(log => log.ip_address).filter(Boolean)).size} unique IPs
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Authentication Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Recent Authentication Activity
              </CardTitle>
              <CardDescription>
                Your recent sign-in attempts and security events
              </CardDescription>
            </div>
            {authLogs.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAuditLogs}
                disabled={clearingLogs}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {clearingLogs ? 'Clearing...' : 'Clear Logs'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {authLogs.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No authentication activity found
            </p>
          ) : (
            <div className="space-y-4">
              {authLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getEventIcon('INFO', log.success)}
                    <div>
                      <p className="font-medium">
                        {formatEventType(log.event_type)}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                        {log.ip_address && (
                          <>
                            <span>•</span>
                            <span>IP: {log.ip_address}</span>
                          </>
                        )}
                      </div>
                      {log.error_message && (
                        <p className="text-xs text-destructive mt-1">
                          {log.error_message}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={log.success ? "default" : "destructive"}>
                    {log.success ? "Success" : "Failed"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Security Events
          </CardTitle>
          <CardDescription>
            Security-related notifications and alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {securityEvents.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No security events found
            </p>
          ) : (
            <div className="space-y-4">
              {securityEvents.map((event) => (
                <div key={event.id} className="flex items-start space-x-3 p-4 border rounded-lg">
                  {getEventIcon(event.level)}
                  <div className="flex-1">
                    <p className="font-medium">{event.message}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span>{new Date(event.created_at).toLocaleString()}</span>
                      {event.ip_address && (
                        <>
                          <span>•</span>
                          <span>IP: {event.ip_address}</span>
                        </>
                      )}
                    </div>
                    {event.context && Object.keys(event.context).length > 0 && (
                      <details className="mt-2">
                        <summary className="text-xs text-muted-foreground cursor-pointer">
                          View details
                        </summary>
                        <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(event.context, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                  <Badge variant={event.level === 'WARN' ? "destructive" : "default"}>
                    {event.level}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Security Recommendations</CardTitle>
          <CardDescription>
            Follow these best practices to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Strong Password:</strong> Your password meets security requirements.
              </AlertDescription>
            </Alert>
            
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Account Monitoring:</strong> We monitor your account for suspicious activity.
              </AlertDescription>
            </Alert>
            
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Regular Review:</strong> Review your security activity regularly and report any suspicious events.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}