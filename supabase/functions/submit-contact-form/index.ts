import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'npm:resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ContactRequest {
  name: string
  email: string
  organization?: string
  phone?: string
  inquiryType: string
  subject?: string
  message: string
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { name, email, organization, phone, inquiryType, subject, message }: ContactRequest = await req.json()

    // Get client IP and user agent for rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                    req.headers.get('x-real-ip') || 
                    'unknown'
    const userAgent = req.headers.get('user-agent') || 'unknown'

    // Validate required fields
    if (!name || !email || !message || !inquiryType) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, email, message, inquiryType' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check rate limiting using database function
    const { data: rateLimitCheck } = await supabase.rpc('check_contact_rate_limit', {
      email_param: email,
      ip_param: clientIP !== 'unknown' ? clientIP : null
    })

    if (!rateLimitCheck) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please wait before submitting again.' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Store submission in database
    const { data: submission, error: dbError } = await supabase
      .from('contact_submissions')
      .insert({
        name,
        email,
        organization,
        phone,
        inquiry_type: inquiryType,
        subject: subject || inquiryType,
        message,
        ip_address: clientIP !== 'unknown' ? clientIP : null,
        user_agent: userAgent
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return new Response(
        JSON.stringify({ error: 'Failed to process submission. Please try again.' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Send email notifications if Resend API key is available
    if (resendApiKey) {
      const resend = new Resend(resendApiKey)
      
      try {
        // Send notification to team
        await resend.emails.send({
          from: 'Pocket Banker <notifications@pocketbanker.ai>',
          to: ['team@pocketbanker.ai'],
          subject: `New ${inquiryType} inquiry from ${name}`,
          html: `
            <h2>New Contact Form Submission</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            ${organization ? `<p><strong>Organization:</strong> ${organization}</p>` : ''}
            ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
            <p><strong>Inquiry Type:</strong> ${inquiryType}</p>
            <p><strong>Subject:</strong> ${subject || inquiryType}</p>
            <p><strong>Message:</strong></p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            <p><strong>Submitted:</strong> ${new Date().toISOString()}</p>
            <p><strong>IP Address:</strong> ${clientIP}</p>
          `
        })

        // Send confirmation to user
        await resend.emails.send({
          from: 'Pocket Banker <hello@pocketbanker.ai>',
          to: [email],
          subject: 'Thank you for contacting Pocket Banker',
          html: `
            <h2>Thank you for your inquiry, ${name}!</h2>
            <p>We've received your message about <strong>${inquiryType}</strong> and will get back to you within 24 hours.</p>
            <p>Here's a copy of your message:</p>
            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <p><strong>Subject:</strong> ${subject || inquiryType}</p>
              <p><strong>Message:</strong><br>${message.replace(/\n/g, '<br>')}</p>
            </div>
            <p>Best regards,<br>The Pocket Banker Team</p>
          `
        })
      } catch (emailError) {
        console.error('Email sending error:', emailError)
        // Don't fail the request if email fails
      }
    }

    console.log('Contact form submission processed:', {
      id: submission.id,
      name,
      email,
      inquiryType,
      timestamp: submission.created_at
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Thank you for your inquiry! We\'ll get back to you within 24 hours.',
        submissionId: submission.id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Contact form submission error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error. Please try again or email us directly at hello@pocketbanker.ai' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}

serve(handler)