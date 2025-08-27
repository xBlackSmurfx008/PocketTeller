import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://dscndbpqvhvylukvcgpq.supabase.co',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface EmailRequest {
  recipientEmail: string;
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

    // Get client IP address
    const clientIP = req.headers.get('cf-connecting-ip') || 
                    req.headers.get('x-forwarded-for') || 
                    req.headers.get('x-real-ip') || 
                    'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    const { recipientEmail, shareUrl, senderName, message }: EmailRequest = await req.json();
    
    // Validate shareUrl host for security
    try {
      const url = new URL(shareUrl);
      // Only allow production domains (no localhost in production)
      const allowedHosts = Deno.env.get('DENO_DEPLOYMENT_ID') 
        ? ['dscndbpqvhvylukvcgpq.supabase.co'] // Production only
        : ['dscndbpqvhvylukvcgpq.supabase.co', 'localhost']; // Development allows localhost
      if (!allowedHosts.includes(url.hostname)) {
        return new Response(
          JSON.stringify({ error: 'Invalid share URL domain' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid share URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limiting first
    const { data: rateLimitOk, error: rateLimitError } = await supabase.rpc('check_share_send_rate', {
      target_user_id: user.id,
      channel_type: 'email',
      request_ip: clientIP
    });

    if (rateLimitError || !rateLimitOk) {
      console.log(`Rate limit exceeded for user ${user.id}, IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate email content for security
    if (message) {
      const { data: isValid, error: validationError } = await supabase
        .rpc('validate_email_content', { content: message });
      
      if (validationError || !isValid) {
        return new Response(
          JSON.stringify({ error: 'Invalid content in message' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Sanitize inputs to prevent HTML injection
    const sanitizeHtml = (input: string) => input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');

    const safeSenderName = senderName ? sanitizeHtml(senderName) : null;
    const safeMessage = message ? sanitizeHtml(message) : null;

    // Validate share URL ownership
    const shareToken = shareUrl.split('/').pop();
    let shareId = null;
    if (shareToken) {
      const { data: share } = await supabase
        .from('budget_shares')
        .select('id, user_id')
        .eq('token', shareToken)
        .single();
      
      if (!share || share.user_id !== user.id) {
        // Log failed attempt with PII masking
        await supabase.from('share_send_log').insert({
          user_id: user.id,
          channel: 'email',
          recipient_masked: recipientEmail.replace(/(.{2}).+@/, '$1***@'), // Mask email
          ip_address: clientIP,
          user_agent: userAgent,
          success: false,
          error_message: 'Unauthorized share access'
        });
        
        return new Response(
          JSON.stringify({ error: 'Unauthorized to share this budget' }),
          { 
            status: 403, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      shareId = share.id;
    }

    if (!recipientEmail || !shareUrl) {
      return new Response(
        JSON.stringify({ error: 'Recipient email and share URL are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Sending budget share email to:', recipientEmail.replace(/(.{2}).+@/, '$1***@'));

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Budget Plan Shared</h2>
        ${safeSenderName ? `<p>Hi! ${safeSenderName} has shared a budget plan with you.</p>` : '<p>Someone has shared a budget plan with you.</p>'}
        ${safeMessage ? `<p style="background: #f5f5f5; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;"><em>"${safeMessage}"</em></p>` : ''}
        <p>Click the link below to view the budget plan:</p>
        <a href="${shareUrl}" style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">View Budget Plan</a>
        <p style="color: #666; font-size: 12px;">This link will expire in 7 days.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 12px;">This email was sent from Pocket Banker. If you did not expect this email, you can safely ignore it.</p>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "Pocket Banker <noreply@resend.dev>",
      to: [recipientEmail],
      subject: `${safeSenderName ? safeSenderName + ' shared' : 'Shared'} a Budget Plan with you`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    // Log successful send with PII masking
    await supabase.from('share_send_log').insert({
      user_id: user.id,
      share_id: shareId,
      channel: 'email',
      recipient_masked: recipientEmail.replace(/(.{2}).+@/, '$1***@'), // Mask email
      ip_address: clientIP,
      user_agent: userAgent,
      success: true
    });

    return new Response(
      JSON.stringify({ success: true, messageId: emailResponse.data?.id }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in send-budget-email:', error);
    
    // Try to log the failed attempt if we have user info
    try {
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const jwt = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(jwt);
        if (user) {
          const clientIP = req.headers.get('cf-connecting-ip') || 'unknown';
          const userAgent = req.headers.get('user-agent') || 'unknown';
          const body = await req.clone().json();
          
          await supabase.from('share_send_log').insert({
            user_id: user.id,
            channel: 'email',
            recipient_masked: (body.recipientEmail || 'unknown').replace(/(.{2}).+@/, '$1***@'), // Mask email
            ip_address: clientIP,
            user_agent: userAgent,
            success: false,
            error_message: error.message ? error.message.substring(0, 100) : 'Unknown error' // Truncate error
          });
        }
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return new Response(
      JSON.stringify({ error: 'Failed to send email' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});