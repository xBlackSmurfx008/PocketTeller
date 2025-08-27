import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

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

  try {
    const { email, source = 'unknown', user_agent }: WaitlistEmailRequest = await req.json();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        {
          status: 400,
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

    // Send the email using Resend
    const emailResponse = await resend.emails.send({
      from: "Pocket Banker <noreply@resend.dev>",
      to: [email],
      subject: "Welcome to the Pocket Banker Waitlist! 🤖",
      html: emailHtml,
    });

    console.log("Waitlist confirmation email sent successfully:", {
      email: email,
      source: source,
      user_agent: user_agent?.substring(0, 100), // Truncate for logging
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
    console.error("Error in send-waitlist-confirmation function:", {
      error: error.message,
      stack: error.stack
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