import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
          details: authError?.message || 'Invalid session'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { limit = 50, threshold = 0.55 }: CategorizeRequest = await req.json();
    
    // Fetch uncategorized transactions
    const { data: transactions, error: fetchError } = await supabaseClient
      .from('transactions')
      .select('id, description, amount, date')
      .eq('user_id', user.id)
      .neq('category_source', 'user')
      .in('category', ['Other', null])
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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
      console.error('Gemini API error:', await geminiResponse.text());
      throw new Error('Gemini API request failed');
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

    for (const cat of categorizations) {
      // Validate category
      if (!CATEGORIES.includes(cat.category)) {
        cat.category = 'Other';
        cat.confidence = 0.3;
        cat.reason = 'Invalid category returned by AI';
      }

      // Apply threshold
      if (cat.confidence >= threshold) {
        updates.push({
          id: cat.id,
          category: cat.category,
          category_source: 'ai',
          category_confidence: cat.confidence,
          category_model: 'gemini-1.5-flash',
          category_reason: cat.reason
        });
      }
    }

    // Batch update transactions
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
        .neq('category_source', 'user'); // Don't overwrite user choices

      if (!updateError) {
        updatedCount++;
      } else {
        console.error('Update error for transaction', update.id, updateError);
      }
    }

    console.log(`AI categorization completed: ${updatedCount} transactions updated`);

    // Check remaining uncategorized transactions
    const { data: remainingTransactions } = await supabaseClient
      .from('transactions')
      .select('id')
      .eq('user_id', user.id)
      .neq('category_source', 'user')
      .in('category', ['Other', null]);

    const remainingCount = remainingTransactions?.length || 0;

    return new Response(
      JSON.stringify({ 
        updatedCount,
        totalProcessed: transactions.length,
        remainingUncategorized: remainingCount,
        details: updatedCount > 0 
          ? `Categorized ${updatedCount} of ${transactions.length} transactions using AI`
          : 'No transactions met the confidence threshold for automatic categorization'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI categorization error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to categorize transactions' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});