import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const resendApiKey = Deno.env.get('RESEND_API_KEY')!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
const resend = new Resend(resendApiKey);

interface MagicLinkRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }

  try {
    const { email }: MagicLinkRequest = await req.json();
    
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Basic rate limiting by IP (best effort)
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    console.log(`Magic link request from IP: ${clientIP} for email: ${normalizedEmail}`);

    // Generate magic link using Supabase Admin API
    const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: normalizedEmail,
      options: {
        redirectTo: 'https://app.pocketbanker.app/'
      }
    });

    if (linkError) {
      console.error('Failed to generate magic link:', linkError);
      return new Response(JSON.stringify({ error: 'Failed to generate magic link' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (!data.properties?.action_link) {
      console.error('No action link in response:', data);
      return new Response(JSON.stringify({ error: 'Invalid magic link generated' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const magicLink = data.properties.action_link;

    // Send the magic link via Resend
    const emailResult = await resend.emails.send({
      from: 'Pocket Banker <noreply@pocketbanker.app>',
      to: [normalizedEmail],
      subject: 'Your Magic Sign-In Link - Pocket Banker',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1a365d; text-align: center;">Pocket Banker</h1>
          <h2 style="color: #2d3748;">Your Magic Sign-In Link</h2>
          
          <p>Hi there!</p>
          
          <p>You requested a magic sign-in link for Pocket Banker. Click the button below to sign in instantly:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${magicLink}" 
               style="background-color: #3182ce; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block; 
                      font-weight: bold;">
              Sign In to Pocket Banker
            </a>
          </div>
          
          <p style="color: #718096; font-size: 14px;">
            If the button doesn't work, you can copy and paste this link into your browser:
          </p>
          <p style="background-color: #f7fafc; padding: 10px; border-radius: 4px; 
                    word-break: break-all; font-family: monospace; font-size: 12px;">
            ${magicLink}
          </p>
          
          <p style="color: #718096; font-size: 14px; margin-top: 30px;">
            This link will expire in 1 hour for security. If you didn't request this, you can safely ignore this email.
          </p>
          
          <hr style="border: 1px solid #e2e8f0; margin: 30px 0;">
          <p style="color: #a0aec0; font-size: 12px; text-align: center;">
            Pocket Banker - Your Personal Finance Assistant
          </p>
        </div>
      `,
    });

    if (emailResult.error) {
      console.error('Failed to send magic link email:', emailResult.error);
      return new Response(JSON.stringify({ error: 'Failed to send email' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log('Magic link sent successfully:', emailResult.data?.id);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Magic link sent successfully',
      emailId: emailResult.data?.id 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error in send-magic-link function:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);