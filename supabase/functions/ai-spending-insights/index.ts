import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Set the auth context
    supabaseClient.auth.setSession({
      access_token: authHeader.replace('Bearer ', ''),
      refresh_token: ''
    });

    // Get user from the token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Authentication failed');
    }

    console.log(`Processing insights for user: ${user.id}`);

    // Parse request body
    const { days = 60, topN = 6 } = await req.json().catch(() => ({}));

    // Get transactions for the last N days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const { data: transactions, error: txError } = await supabaseClient
      .from('transactions')
      .select('id, date, description, amount, category, merchant_name')
      .eq('user_id', user.id)
      .eq('pending', false)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (txError) {
      console.error('Transaction fetch error:', txError);
      throw new Error('Failed to fetch transactions');
    }

    if (!transactions || transactions.length === 0) {
      return new Response(JSON.stringify({
        summary: "No transaction data available for the selected period.",
        topCategories: [],
        savingsOpportunities: [],
        anomalies: [],
        notes: "Add some transactions to get spending insights."
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate spending by category (expenses only)
    const categoryTotals: Record<string, number> = {};
    const merchantTotals: Record<string, number> = {};
    let totalSpend = 0;
    let expenseCount = 0;

    transactions.forEach(tx => {
      if (tx.amount < 0) { // Expenses
        const amount = Math.abs(tx.amount);
        totalSpend += amount;
        expenseCount++;
        
        const category = tx.category || 'Other';
        categoryTotals[category] = (categoryTotals[category] || 0) + amount;
        
        if (tx.merchant_name) {
          merchantTotals[tx.merchant_name] = (merchantTotals[tx.merchant_name] || 0) + amount;
        }
      }
    });

    // Get top categories
    const topCategories = Object.entries(categoryTotals)
      .map(([name, total]) => ({
        name,
        total,
        percent: Math.round((total / totalSpend) * 100)
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, topN);

    // Get top merchants
    const topMerchants = Object.entries(merchantTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Prepare data for Gemini
    const dataForAI = {
      totalSpend: Math.round(totalSpend),
      transactionCount: expenseCount,
      days,
      topCategories,
      topMerchants: topMerchants.map(([name, amount]) => ({ name, amount: Math.round(amount) })),
      recentTransactions: transactions.slice(0, 10).map(tx => ({
        date: tx.date,
        description: tx.description,
        amount: Math.round(tx.amount),
        category: tx.category
      }))
    };

    if (!geminiApiKey) {
      // Fallback response without AI
      return new Response(JSON.stringify({
        summary: `You spent $${Math.round(totalSpend)} across ${expenseCount} transactions in the last ${days} days.`,
        topCategories,
        savingsOpportunities: [
          {
            title: "Review Top Categories",
            description: "Analyze your largest spending categories for potential savings",
            estimatedMonthlySavings: Math.round(totalSpend * 0.1)
          }
        ],
        anomalies: [],
        notes: "Connect Gemini API for detailed AI insights."
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Call Gemini API
    const prompt = `
Analyze this spending data and provide insights in JSON format only. No markdown, no explanation.

Data: ${JSON.stringify(dataForAI)}

Return exactly this JSON structure:
{
  "summary": "Brief 1-2 sentence overview of spending patterns",
  "topCategories": ${JSON.stringify(topCategories)},
  "savingsOpportunities": [
    {
      "title": "Opportunity title",
      "description": "Specific actionable suggestion",
      "estimatedMonthlySavings": number
    }
  ],
  "anomalies": [
    {
      "description": "Notable unusual spending pattern or transaction",
      "date": "YYYY-MM-DD or null",
      "amount": number or null
    }
  ],
  "notes": "Optional additional insight"
}

Focus on actionable insights. Limit savingsOpportunities to 3 items, anomalies to 2 items.
`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      console.error('Gemini API error:', await geminiResponse.text());
      throw new Error('Gemini API request failed');
    }

    const geminiData = await geminiResponse.json();
    const aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiText) {
      throw new Error('No response from Gemini');
    }

    // Parse JSON from AI response
    let insights;
    try {
      // Clean up potential markdown
      const cleanText = aiText.replace(/```json\n?|\n?```/g, '').trim();
      insights = JSON.parse(cleanText);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Invalid AI response format');
    }

    // Validate and sanitize response
    const sanitizedInsights = {
      summary: insights.summary || `You spent $${Math.round(totalSpend)} in the last ${days} days.`,
      topCategories: topCategories, // Use our calculated data
      savingsOpportunities: (insights.savingsOpportunities || []).slice(0, 3).map((opp: any) => ({
        title: String(opp.title || '').slice(0, 100),
        description: String(opp.description || '').slice(0, 200),
        estimatedMonthlySavings: Math.max(0, Math.min(Number(opp.estimatedMonthlySavings) || 0, totalSpend))
      })),
      anomalies: (insights.anomalies || []).slice(0, 2).map((anomaly: any) => ({
        description: String(anomaly.description || '').slice(0, 200),
        date: anomaly.date || null,
        amount: anomaly.amount || null
      })),
      notes: insights.notes ? String(insights.notes).slice(0, 300) : null
    };

    console.log('Generated insights successfully');

    return new Response(JSON.stringify(sanitizedInsights), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-spending-insights function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        summary: "Unable to generate insights at this time.",
        topCategories: [],
        savingsOpportunities: [],
        anomalies: []
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});