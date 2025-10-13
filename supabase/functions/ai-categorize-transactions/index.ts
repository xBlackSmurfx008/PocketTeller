import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string, maxRequests = 100, windowMs = 3600000): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (userLimit.count >= maxRequests) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

const CATEGORIES = [
  'Food & Dining',
  'Transportation', 
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Travel',
  'Education',
  'Income',
  'Other'
];

interface CategorizeRequest {
  limit?: number;
  threshold?: number;
}

interface GeminiResponse {
  id: string;
  category: string;
  confidence: number;
  reason: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract JWT token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized',
          details: 'Authorization header missing'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify user authentication using the JWT
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt);
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ 
          error: 'Unauthorized',
          details: 'Invalid session'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    if (!checkRateLimit(user.id)) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded. Please try again later.',
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { limit = 100, threshold = 0.70 }: CategorizeRequest = await req.json();
    
    // Fetch transactions that need AI categorization
    // Priority: user > plaid > ai > auto
    // Only categorize transactions where:
    // - Category is 'Other' or null (unclear categorization)
    // - Source is 'auto' or null (not from Plaid's specific data or user choice)
    // This ensures Plaid's authoritative data is never overwritten by AI
    const { data: transactions, error: fetchError } = await supabaseClient
      .from('transactions')
      .select('id, description, amount, date, category_source')
      .eq('user_id', user.id)
      .in('category', ['Other', null])
      .in('category_source', ['auto', null])
      .order('date', { ascending: false })
      .limit(limit);

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch transactions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!transactions || transactions.length === 0) {
      return new Response(
        JSON.stringify({ updatedCount: 0, message: 'No transactions to categorize' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare Gemini request
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const prompt = `You are a financial transaction categorizer. Analyze these transactions and categorize them into one of these categories: ${CATEGORIES.join(', ')}.

For each transaction, return a JSON object with:
- id: the transaction id
- category: one of the allowed categories
- confidence: number between 0 and 1 indicating your confidence
- reason: brief explanation of why you chose this category

Transactions to categorize:
${transactions.map(t => `ID: ${t.id}, Description: "${t.description}", Amount: $${t.amount}, Date: ${t.date}`).join('\n')}

Return only a JSON array of objects, no additional text.`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 2048,
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error - Status:', geminiResponse.status, 'Response:', errorText);
      
      // Handle specific Gemini API errors
      if (geminiResponse.status === 429) {
        throw new Error('AI service is temporarily rate limited. Please try again in a few minutes.');
      } else if (geminiResponse.status === 403) {
        throw new Error('AI service access denied. Please check your API configuration.');
      } else {
        throw new Error(`AI service error (${geminiResponse.status}): ${errorText}`);
      }
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      throw new Error('No response from Gemini');
    }

    // Parse Gemini response
    let categorizations: GeminiResponse[];
    try {
      // Clean response text - remove markdown formatting if present
      const cleanedText = responseText.replace(/```json\n?|\n?```/g, '').trim();
      categorizations = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', responseText);
      throw new Error('Invalid response format from AI');
    }

    // Validate and update transactions
    let updatedCount = 0;
    const updates = [];
    let lowConfidenceCount = 0;

    for (const cat of categorizations) {
      // Validate category
      if (!CATEGORIES.includes(cat.category)) {
        console.warn(`Invalid category "${cat.category}" returned by AI for transaction ${cat.id}`);
        cat.category = 'Other';
        cat.confidence = 0.3;
        cat.reason = 'Invalid category returned by AI';
      }

      // Apply threshold - only high confidence categorizations are applied
      if (cat.confidence >= threshold) {
        updates.push({
          id: cat.id,
          category: cat.category,
          category_source: 'ai',
          category_confidence: cat.confidence,
          category_model: 'gemini-2.5-flash',
          category_reason: cat.reason
        });
      } else {
        lowConfidenceCount++;
        console.log(`Low confidence (${cat.confidence}) for transaction ${cat.id}, skipping auto-categorization`);
      }
    }

    // Batch update transactions
    // Priority: user > plaid > ai > auto
    for (const update of updates) {
      const { error: updateError } = await supabaseClient
        .from('transactions')
        .update({
          category: update.category,
          category_source: update.category_source,
          category_confidence: update.category_confidence,
          category_model: update.category_model,
          category_reason: update.category_reason
        })
        .eq('id', update.id)
        .eq('user_id', user.id)
        .in('category_source', ['auto', null]); // Only update auto-categorized, never user or plaid

      if (!updateError) {
        updatedCount++;
      } else {
        console.error('Update error for transaction', update.id, updateError);
      }
    }

    console.log(`AI categorization completed: ${updatedCount} transactions updated, ${lowConfidenceCount} skipped due to low confidence`);

    // Check remaining uncategorized transactions (that could benefit from AI)
    const { data: remainingTransactions } = await supabaseClient
      .from('transactions')
      .select('id')
      .eq('user_id', user.id)
      .in('category', ['Other', null])
      .in('category_source', ['auto', null]);

    const remainingCount = remainingTransactions?.length || 0;

    return new Response(
      JSON.stringify({ 
        updatedCount,
        totalProcessed: transactions.length,
        remainingUncategorized: remainingCount,
        lowConfidenceCount,
        threshold,
        details: updatedCount > 0 
          ? `Successfully categorized ${updatedCount} of ${transactions.length} transactions using AI (threshold: ${threshold * 100}%)${lowConfidenceCount > 0 ? `. ${lowConfidenceCount} transactions had low confidence and were skipped.` : ''}`
          : lowConfidenceCount > 0
          ? `No transactions met the ${threshold * 100}% confidence threshold for automatic categorization. ${lowConfidenceCount} transactions need manual review.`
          : 'No transactions needed categorization'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI categorization error:', error);
    
    // Sanitize error message for user consumption
    let sanitizedError = 'Service temporarily unavailable';
    let statusCode = 500;
    
    if (error.message?.includes('Rate limit') || error.message?.includes('429')) {
      sanitizedError = 'AI service is temporarily busy. Please try again in a few minutes.';
      statusCode = 429;
    } else if (error.message?.includes('Unauthorized') || error.message?.includes('Invalid session')) {
      sanitizedError = 'Your session has expired. Please refresh the page and try again.';
      statusCode = 401;
    } else if (error.message?.includes('not configured') || error.message?.includes('GEMINI_API_KEY')) {
      sanitizedError = 'AI service is temporarily unavailable. Please try again later.';
      statusCode = 503;
    } else if (error.message?.includes('AI service')) {
      sanitizedError = error.message;
    }
    
    console.error('Final error response:', { sanitizedError, statusCode, originalError: error.message });
    
    return new Response(
      JSON.stringify({ error: sanitizedError }),
      { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});