import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
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

    const { recipientEmail, shareUrl, senderName, message }: EmailRequest = await req.json();

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

    if (!recipientEmail || !shareUrl) {
      return new Response(
        JSON.stringify({ error: 'Recipient email and share URL are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Sending budget share email to:', recipientEmail);

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Budget Plan Shared</h2>
        ${senderName ? `<p>Hi! ${senderName} has shared a budget plan with you.</p>` : '<p>Someone has shared a budget plan with you.</p>'}
        ${message ? `<p style="background: #f5f5f5; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;"><em>"${message}"</em></p>` : ''}
        <p>Click the link below to view the budget plan:</p>
        <a href="${shareUrl}" style="display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0;">View Budget Plan</a>
        <p style="color: #666; font-size: 12px;">This link will expire in 7 days.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #888; font-size: 12px;">This email was sent from Budget AI. If you did not expect this email, you can safely ignore it.</p>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "Budget AI <noreply@resend.dev>",
      to: [recipientEmail],
      subject: `${senderName ? senderName + ' shared' : 'Shared'} a Budget Plan with you`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, messageId: emailResponse.data?.id }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in send-budget-email:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send email' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});