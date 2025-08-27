
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WaitlistEmailRequest {
  email: string;
  source?: string;
  user_agent?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Create service role client for anti-abuse checks
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { email, source = 'unknown', user_agent }: WaitlistEmailRequest = await req.json();

    // Extract client IP
    const clientIP = req.headers.get('cf-connecting-ip') || 
                    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                    req.headers.get('x-real-ip') || 
                    'unknown';
    const safeIP = clientIP !== 'unknown' ? clientIP.split(',')[0].trim() : null;

    // Mask email for logging
    const emailMasked = email.replace(/(.{2}).+@/, '$1***@');

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      // Log failed attempt
      try {
        await supabase.from('waitlist_email_log').insert({
          email_masked: emailMasked,
          ip_address: safeIP,
          user_agent: user_agent?.substring(0, 100),
          success: false,
          error_message: 'Invalid email format'
        });
      } catch (logError) {
        console.error('Failed to log invalid email:', logError);
      }

      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if email signed up recently (within 30 days)
    const { data: hasRecentSignup, error: signupError } = await supabase.rpc('has_recent_waitlist_signup', {
      email_param: email,
      days_param: 30
    });

    if (signupError || !hasRecentSignup) {
      // Log failed attempt
      try {
        await supabase.from('waitlist_email_log').insert({
          email_masked: emailMasked,
          ip_address: safeIP,
          user_agent: user_agent?.substring(0, 100),
          success: false,
          error_message: 'No recent waitlist signup found'
        });
      } catch (logError) {
        console.error('Failed to log signup check:', logError);
      }

      return new Response(
        JSON.stringify({ error: "Email not found in recent waitlist signups" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check rate limiting (now properly fixed)
    const { data: rateLimitOk, error: rateLimitError } = await supabase.rpc('check_waitlist_email_rate', {
      email_param: email,
      ip_param: safeIP
    });

    if (rateLimitError || !rateLimitOk) {
      // Log rate limit hit
      try {
        await supabase.from('waitlist_email_log').insert({
          email_masked: emailMasked,
          ip_address: safeIP,
          user_agent: user_agent?.substring(0, 100),
          success: false,
          error_message: 'Rate limit exceeded'
        });
      } catch (logError) {
        console.error('Failed to log rate limit:', logError);
      }

      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create the email HTML template
    const emailHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Pocket Banker!</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px 20px; text-align: center;">
          <div style="color: white; font-size: 28px; font-weight: bold; margin-bottom: 8px;">
            🤖 Pocket Banker
          </div>
          <div style="color: #e2e8f0; font-size: 16px;">
            Smart Financial Management with AI
          </div>
        </div>

        <!-- Main Content -->
        <div style="padding: 40px 30px;">
          <h1 style="color: #1e293b; font-size: 24px; font-weight: bold; margin-bottom: 20px; text-align: center;">
            Welcome to the Waitlist! 🎉
          </h1>
          
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Hi there!
          </p>
          
          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Thanks for joining the Pocket Banker waitlist! You're now part of an exclusive group getting early access to the future of personal finance management.
          </p>

          <!-- Launch Date Highlight -->
          <div style="background-color: #f1f5f9; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0; border-radius: 4px;">
            <h2 style="color: #1e40af; font-size: 18px; font-weight: bold; margin: 0 0 10px 0;">
              🚀 Mark Your Calendar!
            </h2>
            <p style="color: #475569; font-size: 16px; margin: 0; font-weight: 500;">
              We're launching on <strong>October 16th, 2025</strong>
            </p>
          </div>

          <!-- Features Preview -->
          <h3 style="color: #1e293b; font-size: 18px; font-weight: bold; margin: 30px 0 15px 0;">
            What to expect:
          </h3>
          <ul style="color: #475569; font-size: 16px; line-height: 1.6; padding-left: 20px;">
            <li style="margin-bottom: 8px;">🧠 AI-powered budget insights and recommendations</li>
            <li style="margin-bottom: 8px;">📊 Smart expense tracking and categorization</li>
            <li style="margin-bottom: 8px;">🎯 Goal setting and progress monitoring</li>
            <li style="margin-bottom: 8px;">🔗 Secure bank account integration</li>
            <li style="margin-bottom: 8px;">💬 Conversational AI financial assistant</li>
          </ul>

          <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 30px 0 20px 0;">
            We'll send you an email as soon as Pocket Banker is live. Get ready to take control of your finances like never before!
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <div style="background-color: #1e40af; color: white; padding: 12px 24px; border-radius: 6px; display: inline-block; font-weight: 500;">
              You're on the list! 🎉
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 14px; margin: 0 0 10px 0;">
            This email was sent from Pocket Banker
          </p>
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            If you no longer wish to receive these emails, you can unsubscribe at any time.
          </p>
        </div>
      </div>
    </body>
    </html>
    `;

    // Send the email using Resend with your verified domain
    const emailResponse = await resend.emails.send({
      from: "Pocket Banker <hello@pocketbanker.app>",
      to: [email],
      subject: "Welcome to the Pocket Banker Waitlist! 🤖",
      html: emailHtml,
    });

    // Log successful send (with masked email)
    try {
      await supabase.from('waitlist_email_log').insert({
        email_masked: emailMasked,
        ip_address: safeIP,
        user_agent: user_agent?.substring(0, 100),
        success: true
      });
    } catch (logError) {
      console.error('Failed to log success:', logError);
    }

    console.log("Waitlist confirmation email sent successfully:", {
      email_masked: emailMasked,
      source: source,
      user_agent: user_agent?.substring(0, 100),
      resend_id: emailResponse.data?.id
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Confirmation email sent successfully",
        email_id: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    // Try to log the error (with masked email if available)
    try {
      const body = await req.clone().json();
      const emailMasked = body.email?.replace(/(.{2}).+@/, '$1***@') || 'unknown';
      const clientIP = req.headers.get('cf-connecting-ip') || 
                      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                      'unknown';
      const safeIP = clientIP !== 'unknown' ? clientIP : null;
      
      await supabase.from('waitlist_email_log').insert({
        email_masked: emailMasked,
        ip_address: safeIP,
        user_agent: body.user_agent?.substring(0, 100),
        success: false,
        error_message: error.message?.substring(0, 100) || 'Unknown error'
      });
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }
    
    console.error("Error in send-waitlist-confirmation function:", {
      error: error.message,
      // Don't log stack trace to avoid potential PII leakage
    });
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to send confirmation email",
        details: error.message 
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
