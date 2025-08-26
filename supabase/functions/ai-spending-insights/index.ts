import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InsightsRequest {
  days?: number;
  topN?: number;
}

interface SpendingInsight {
  summary: string;
  topCategories: Array<{
    name: string;
    total: number;
    percent: number;
  }>;
  savingsOpportunities: Array<{
    title: string;
    description: string;
    estimatedMonthlySavings: number;
  }>;
  anomalies: Array<{
    description: string;
    date?: string;
    amount?: number;
  }>;
  notes?: string;
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

    const { days = 60, topN = 6 }: InsightsRequest = await req.json();
    
    // Fetch recent transactions (expenses only - exclude Income category)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const { data: transactions, error: fetchError } = await supabaseClient
      .from('transactions')
      .select('id, description, amount, date, category, merchant_name')
      .eq('user_id', user.id)
      .eq('pending', false)
      .neq('category', 'Income') // Exclude income transactions
      .gte('date', cutoffDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch transactions',
          details: fetchError.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!transactions || transactions.length === 0) {
      return new Response(
        JSON.stringify({
          summary: `No expense transactions found in the last ${days} days.`,
          topCategories: [],
          savingsOpportunities: [],
          anomalies: [],
          notes: 'Add some transactions to see AI insights!'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Compute aggregates
    const categoryTotals = transactions.reduce((acc, t) => {
      const category = t.category || 'Other';
      acc[category] = (acc[category] || 0) + Math.abs(t.amount);
      return acc;
    }, {} as Record<string, number>);

    const merchantTotals = transactions.reduce((acc, t) => {
      const merchant = t.merchant_name || t.description || 'Unknown';
      acc[merchant] = (acc[merchant] || 0) + Math.abs(t.amount);
      return acc;
    }, {} as Record<string, number>);

    const totalSpend = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
    const transactionCount = transactions.length;

    const topCategories = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, topN)
      .map(([name, total]) => ({
        name,
        total: Math.round(total * 100) / 100,
        percent: Math.round((total / totalSpend) * 100)
      }));

    const topMerchants = Object.entries(merchantTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    // Prepare Gemini request
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          error: 'AI service not configured',
          details: 'Gemini API key is missing'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = `You are a financial advisor analyzing spending patterns. Based on this data, provide insights in the exact JSON format requested.

Spending Data (last ${days} days):
- Total spent: $${totalSpend.toFixed(2)}
- Number of transactions: ${transactionCount}
- Top categories: ${topCategories.map(c => `${c.name}: $${c.total} (${c.percent}%)`).join(', ')}
- Top merchants: ${topMerchants.map(([name, total]) => `${name}: $${total.toFixed(2)}`).join(', ')}

Recent transactions sample:
${transactions.slice(0, 10).map(t => `${t.date}: ${t.description} - $${Math.abs(t.amount)} (${t.category})`).join('\n')}

Return ONLY a JSON object with these exact fields:
{
  "summary": "Brief 2-3 sentence overview of spending patterns",
  "topCategories": [{"name": "category", "total": number, "percent": number}],
  "savingsOpportunities": [{"title": "brief title", "description": "actionable advice", "estimatedMonthlySavings": number}],
  "anomalies": [{"description": "unusual pattern or transaction", "date": "YYYY-MM-DD", "amount": number}],
  "notes": "optional additional insight"
}

Important: Use the exact category names and totals provided above. Keep descriptions practical and actionable.`;

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
            temperature: 0.3,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    if (!geminiResponse.ok) {
      console.error('Gemini API error:', await geminiResponse.text());
      return new Response(
        JSON.stringify({ 
          error: 'AI service error',
          details: 'Failed to generate insights'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!responseText) {
      throw new Error('No response from Gemini');
    }

    // Parse and validate Gemini response
    let insights: SpendingInsight;
    try {
      const cleanedText = responseText.replace(/```json\n?|\n?```/g, '').trim();
      insights = JSON.parse(cleanedText);
      
      // Validate and use our computed topCategories
      insights.topCategories = topCategories;
      
      // Clamp savings estimates
      if (insights.savingsOpportunities) {
        insights.savingsOpportunities = insights.savingsOpportunities.map(opp => ({
          ...opp,
          estimatedMonthlySavings: Math.min(Math.max(opp.estimatedMonthlySavings || 0, 0), totalSpend / 2)
        }));
      }
      
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', responseText);
      // Fallback response
      insights = {
        summary: `You spent $${totalSpend.toFixed(2)} across ${transactionCount} transactions in the last ${days} days.`,
        topCategories,
        savingsOpportunities: [],
        anomalies: [],
        notes: 'AI analysis temporarily unavailable'
      };
    }

    console.log(`AI insights generated for user ${user.id}: ${totalSpend.toFixed(2)} total spend`);

    return new Response(
      JSON.stringify(insights),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI insights error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message || 'Failed to generate spending insights'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});