import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface LogEntry {
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  context?: Record<string, any>;
  sessionId?: string;
  url?: string;
  userAgent?: string;
  timestamp: string;
}

interface LogCollectorRequest {
  logs: LogEntry[];
  userId?: string;
  batchId?: string;
}

const getClientIP = (req: Request): string | null => {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }
  
  return null;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body: LogCollectorRequest = await req.json();
    const { logs, userId } = body;
    
    if (!logs || !Array.isArray(logs) || logs.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid logs data' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate logs format
    for (const log of logs) {
      if (!log.level || !log.message || !log.timestamp) {
        return new Response(JSON.stringify({ error: 'Invalid log entry format' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const clientIP = getClientIP(req);
    
    // Prepare log entries for insertion
    const logEntries = logs.map(log => ({
      user_id: userId || null,
      level: log.level,
      message: log.message,
      context: log.context || {},
      session_id: log.sessionId,
      url: log.url,
      user_agent: log.userAgent,
      ip_address: clientIP,
      created_at: new Date(log.timestamp).toISOString()
    }));

    // Batch insert logs
    const { error: insertError } = await supabase
      .from('app_logs')
      .insert(logEntries);

    if (insertError) {
      console.error('Failed to insert logs:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to store logs' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      processed: logs.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Log collector error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});