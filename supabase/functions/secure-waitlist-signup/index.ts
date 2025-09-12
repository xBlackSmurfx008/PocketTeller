// Secure waitlist signup edge function
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { 
        status: 405, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }

  try {
    const { email, source = 'home_hero', user_agent } = await req.json();
    
    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // Extract client IP for rate limiting
    const clientIP = req.headers.get('cf-connecting-ip') || 
                    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                    req.headers.get('x-real-ip') || 
                    '0.0.0.0';

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Call secure waitlist signup RPC with client IP
    const { data, error } = await supabase.rpc('waitlist_signup', {
      email_param: email,
      user_agent_param: user_agent,
      source_param: source,
      client_ip_param: clientIP
    });

    if (error) {
      console.error('Waitlist signup error:', error);
      return new Response(
        JSON.stringify({ error: "Failed to process signup" }),
        { 
          status: 500, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    // Always return 200 OK with success/error in body for better frontend handling
    if (!data.success) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: data.error 
        }),
        { 
          status: 200, 
          headers: { "Content-Type": "application/json", ...corsHeaders } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: data.message 
      }),
      { 
        status: 200, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );

  } catch (error) {
    console.error('Unexpected error in waitlist signup:', error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json", ...corsHeaders } 
      }
    );
  }
};

serve(handler);