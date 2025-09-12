import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, ExternalLink, Database, Zap, Shield, Monitor } from "lucide-react";

/**
 * Production Runbook Component
 * Displays deployment checklist and operational guides
 */
export function ProductionRunbook() {
  return (
    <div className="space-y-8 p-6 max-w-6xl mx-auto">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-primary">Production Runbook</h1>
        <p className="text-muted-foreground text-lg">
          Deployment checklist and operational procedures for Pocket Banker
        </p>
      </div>

      {/* Security Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Checklist
          </CardTitle>
          <CardDescription>
            Critical security configurations that must be verified before production
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Plaid webhook signature verification enabled</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Database RLS policies implemented</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Rate limiting on all endpoints</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span>Password policy: 12+ chars required</span>
                <Badge variant="outline">Manual Setup</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Encrypted Plaid token storage</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Audit logging for sensitive operations</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Console logs cleaned up for production</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span>Leaked password protection</span>
                <Badge variant="outline">Dashboard Config</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Environment Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Environment Configuration
          </CardTitle>
          <CardDescription>
            Required environment variables and database settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Required Secrets</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>✅ PLAID_CLIENT_ID</div>
              <div>✅ PLAID_SECRET</div>
              <div>✅ PLAID_ENV</div>
              <div>✅ PLAID_ENCRYPTION_KEY</div>
              <div>⚠️ PLAID_WEBHOOK_VERIFICATION_KEY</div>
              <div>✅ GEMINI_API_KEY</div>
              <div>✅ RESEND_API_KEY</div>
              <div>✅ SUPABASE_SERVICE_ROLE_KEY</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monitoring & Observability */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Monitoring & Observability
          </CardTitle>
          <CardDescription>
            How to monitor application health and troubleshoot issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Application Logs</h4>
              <ul className="space-y-1 text-sm">
                <li>• Structured logging via log-collector function</li>
                <li>• Client errors automatically sent to backend</li>
                <li>• User-specific log filtering available</li>
                <li>• Check app_logs table in Supabase</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Edge Function Logs</h4>
              <ul className="space-y-1 text-sm">
                <li>• View in Supabase Dashboard → Functions</li>
                <li>• Each function has dedicated log stream</li>
                <li>• Error tracking with context</li>
                <li>• Performance metrics available</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Key Metrics to Monitor</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-muted p-3 rounded">
                <div className="font-medium">API Response Times</div>
                <div className="text-muted-foreground">Edge functions latency</div>
              </div>
              <div className="bg-muted p-3 rounded">
                <div className="font-medium">Error Rates</div>
                <div className="text-muted-foreground">Failed requests %</div>
              </div>
              <div className="bg-muted p-3 rounded">
                <div className="font-medium">Authentication</div>
                <div className="text-muted-foreground">Login success rate</div>
              </div>
              <div className="bg-muted p-3 rounded">
                <div className="font-medium">Plaid Sync</div>
                <div className="text-muted-foreground">Transaction sync status</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Optimization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Performance Optimization
          </CardTitle>
          <CardDescription>
            Recommendations for optimal production performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Database</h4>
              <ul className="space-y-1 text-sm">
                <li>✅ Indexes on frequently queried columns</li>
                <li>✅ Connection pooling enabled</li>
                <li>✅ Query optimization with proper RLS</li>
                <li>• Consider read replicas for heavy workloads</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Frontend</h4>
              <ul className="space-y-1 text-sm">
                <li>✅ Code splitting with React lazy loading</li>
                <li>✅ Image optimization with lazy loading</li>
                <li>✅ Bundle size optimization</li>
                <li>• CDN configuration for static assets</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deployment Process */}
      <Card>
        <CardHeader>
          <CardTitle>Deployment Process</CardTitle>
          <CardDescription>
            Step-by-step deployment and rollback procedures
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Pre-Deployment</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Run security linter: <code className="bg-muted px-2 py-1 rounded">supabase db lint</code></li>
                <li>Verify all environment variables are set</li>
                <li>Test Plaid webhook endpoint functionality</li>
                <li>Check database migration status</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Deployment</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Deploy edge functions: <code className="bg-muted px-2 py-1 rounded">supabase functions deploy</code></li>
                <li>Apply database migrations if any</li>
                <li>Deploy frontend to your hosting platform</li>
                <li>Verify critical user flows work</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Post-Deployment</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Monitor error rates for first 30 minutes</li>
                <li>Check edge function logs for any issues</li>
                <li>Verify Plaid integration is working</li>
                <li>Test user authentication flows</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Button variant="outline" asChild>
          <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Supabase Dashboard
          </a>
        </Button>
        <Button variant="outline" asChild>
          <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Edge Functions
          </a>
        </Button>
        <Button variant="outline" asChild>
          <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Secrets Management
          </a>
        </Button>
        <Button variant="outline" asChild>
          <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            User Management
          </a>
        </Button>
      </div>
    </div>
  );
}