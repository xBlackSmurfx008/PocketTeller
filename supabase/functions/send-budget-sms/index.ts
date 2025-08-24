import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface SMSRequest {
  phoneNumber: string;
  shareUrl: string;
  senderName?: string;
  message?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { phoneNumber, shareUrl, senderName, message }: SMSRequest = await req.json();

    // Validate share URL ownership
    const shareToken = shareUrl.split('/').pop();
    if (shareToken) {
      const { data: share } = await supabase
        .from('budget_shares')
        .select('user_id')
        .eq('token', shareToken)
        .single();
      
      if (!share || share.user_id !== user.id) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized to share this budget' }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    if (!phoneNumber || !shareUrl) {
      return new Response(
        JSON.stringify({ error: 'Phone number and share URL are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Sending budget share SMS to:', phoneNumber);

    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      return new Response(
        JSON.stringify({ error: 'Twilio credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Construct SMS message
    let smsText = senderName 
      ? `Hi! ${senderName} shared a budget plan with you.` 
      : 'Someone shared a budget plan with you.';
    
    if (message) {
      smsText += `\n\nMessage: "${message}"`;
    }
    
    smsText += `\n\nView it here: ${shareUrl}\n\n(Link expires in 7 days)`;

    // Send SMS via Twilio API
    const auth = btoa(`${twilioAccountSid}:${twilioAuthToken}`);
    
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: twilioPhoneNumber,
          To: phoneNumber,
          Body: smsText,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Twilio API error:', errorText);
      throw new Error(`Twilio API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('SMS sent successfully:', result);

    return new Response(
      JSON.stringify({ success: true, messageId: result.sid }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in send-budget-sms:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send SMS' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});