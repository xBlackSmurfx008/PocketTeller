import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const plaidWebhookVerificationKey = Deno.env.get('PLAID_WEBHOOK_VERIFICATION_KEY');

interface PlaidWebhookPayload {
  webhook_type: string;
  webhook_code: string;
  item_id: string;
  user_id?: string;
  error?: any;
  new_transactions?: number;
  removed_transactions?: string[];
}

const logWebhookEvent = (level: 'info' | 'warn' | 'error', message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    function: 'plaid-webhook',
    message,
    data: data ? JSON.stringify(data) : undefined
  };
  console.log(JSON.stringify(logEntry));
};

const verifyWebhookSignature = async (body: string, signature: string): Promise<boolean> => {
  if (!plaidWebhookVerificationKey || !signature) {
    return false;
  }
  
  try {
    // Import the secret key for HMAC using Web Crypto API
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(plaidWebhookVerificationKey),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    // Sign the payload
    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(body)
    );
    
    // Convert to hex string
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Compare with provided signature (strip any prefix)
    const providedSignature = signature.replace(/^sha256=/, '');
    
    // Constant time comparison
    let isValid = expectedSignature.length === providedSignature.length;
    for (let i = 0; i < expectedSignature.length && i < providedSignature.length; i++) {
      isValid = isValid && (expectedSignature[i] === providedSignature[i]);
    }
    
    return isValid;
  } catch (error) {
    logWebhookEvent('error', 'Signature verification failed', { error: error.message });
    return false;
  }
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
    const signature = req.headers.get('plaid-signature') || ''; // Correct Plaid header
    const body = await req.text();
    
    // Verify webhook signature in staging/production
    const environment = Deno.env.get('PLAID_ENV') || 'sandbox';
    if (environment !== 'sandbox' && plaidWebhookVerificationKey) {
      if (!signature) {
        logWebhookEvent('warn', 'Missing webhook signature', { environment });
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const isValid = await verifyWebhookSignature(body, signature);
      if (!isValid) {
        logWebhookEvent('warn', 'Invalid webhook signature', { environment });
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const payload: PlaidWebhookPayload = JSON.parse(body);
    logWebhookEvent('info', 'Webhook received', { 
      type: payload.webhook_type, 
      code: payload.webhook_code,
      item_id: payload.item_id 
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (payload.webhook_type) {
      case 'TRANSACTIONS':
        await handleTransactionsWebhook(supabase, payload);
        break;
        
      case 'ITEM':
        await handleItemWebhook(supabase, payload);
        break;
        
      case 'AUTH':
        await handleAuthWebhook(supabase, payload);
        break;
        
      default:
        logWebhookEvent('warn', 'Unhandled webhook type', { type: payload.webhook_type });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    logWebhookEvent('error', 'Webhook processing failed', { error: error.message });
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleTransactionsWebhook(supabase: any, payload: PlaidWebhookPayload) {
  const { webhook_code, item_id, new_transactions, removed_transactions } = payload;
  
  try {
    // Find the user associated with this item
    const { data: plaidItem, error: itemError } = await supabase
      .from('plaid_items')
      .select('user_id')
      .eq('item_id', item_id)
      .single();

    if (itemError || !plaidItem) {
      logWebhookEvent('warn', 'Item not found for webhook', { item_id });
      return;
    }

    switch (webhook_code) {
      case 'SYNC_UPDATES_AVAILABLE':
        logWebhookEvent('info', 'Sync updates available', { 
          item_id, 
          user_id: plaidItem.user_id,
          new_transactions 
        });
        
        // Mark item as needing sync
        await supabase
          .from('plaid_items')
          .update({ 
            update_type: 'transactions',
            updated_at: new Date().toISOString()
          })
          .eq('item_id', item_id);
        break;

      case 'HISTORICAL_UPDATE':
        logWebhookEvent('info', 'Historical update received', { 
          item_id, 
          user_id: plaidItem.user_id 
        });
        break;

      case 'DEFAULT_UPDATE':
        logWebhookEvent('info', 'Default update received', { 
          item_id, 
          user_id: plaidItem.user_id,
          new_transactions 
        });
        break;

      case 'TRANSACTIONS_REMOVED':
        if (removed_transactions?.length) {
          logWebhookEvent('info', 'Transactions removed', { 
            item_id, 
            user_id: plaidItem.user_id,
            count: removed_transactions.length 
          });
          
          // Remove transactions from database
          await supabase
            .from('transactions')
            .delete()
            .eq('user_id', plaidItem.user_id)
            .in('plaid_transaction_id', removed_transactions);
        }
        break;
    }
  } catch (error) {
    logWebhookEvent('error', 'Transaction webhook handling failed', { 
      webhook_code, 
      item_id, 
      error: error.message 
    });
  }
}

async function handleItemWebhook(supabase: any, payload: PlaidWebhookPayload) {
  const { webhook_code, item_id, error: plaidError } = payload;
  
  try {
    switch (webhook_code) {
      case 'ERROR':
        logWebhookEvent('warn', 'Item error received', { 
          item_id, 
          error: plaidError 
        });
        
        // Update item with error status
        await supabase
          .from('plaid_items')
          .update({ 
            update_type: 'error',
            updated_at: new Date().toISOString()
          })
          .eq('item_id', item_id);
        break;

      case 'PENDING_EXPIRATION':
        logWebhookEvent('warn', 'Item pending expiration', { item_id });
        break;

      case 'USER_PERMISSION_REVOKED':
        logWebhookEvent('warn', 'User permission revoked', { item_id });
        
        // Mark item as disconnected
        await supabase
          .from('plaid_items')
          .update({ 
            update_type: 'disconnected',
            updated_at: new Date().toISOString()
          })
          .eq('item_id', item_id);
        break;

      case 'WEBHOOK_UPDATE_ACKNOWLEDGED':
        logWebhookEvent('info', 'Webhook update acknowledged', { item_id });
        break;
    }
  } catch (error) {
    logWebhookEvent('error', 'Item webhook handling failed', { 
      webhook_code, 
      item_id, 
      error: error.message 
    });
  }
}

async function handleAuthWebhook(supabase: any, payload: PlaidWebhookPayload) {
  const { webhook_code, item_id } = payload;
  
  logWebhookEvent('info', 'Auth webhook received', { 
    webhook_code, 
    item_id 
  });
  
  // Auth webhooks are informational, no action needed typically
}