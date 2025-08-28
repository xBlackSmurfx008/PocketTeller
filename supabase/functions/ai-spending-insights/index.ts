import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string, maxRequests = 50, windowMs = 3600000): boolean {
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

    // Deterministic anomaly detection
    const detectAnomalies = () => {
      const anomalies: Array<{description: string; date?: string; amount?: number; transactionId?: string}> = [];
      const avgTransactionAmount = totalSpend / transactionCount;
      const largeThreshold = Math.max(avgTransactionAmount * 3, 200); // 3x average or $200, whichever is higher
      
      // Large transactions
      const largeTransactions = transactions.filter(t => Math.abs(t.amount) > largeThreshold);
      largeTransactions.slice(0, 3).forEach(t => {
        anomalies.push({
          description: `Large ${t.category} transaction: ${t.description}`,
          date: t.date,
          amount: Math.abs(t.amount),
          transactionId: t.id
        });
      });

      // Duplicate amounts (potential recurring charges)
      const amountGroups = transactions.reduce((acc, t) => {
        const amount = Math.abs(t.amount);
        if (!acc[amount]) acc[amount] = [];
        acc[amount].push(t);
        return acc;
      }, {} as Record<number, any[]>);

      Object.entries(amountGroups)
        .filter(([, txns]) => txns.length >= 3)
        .slice(0, 2)
        .forEach(([amount, txns]) => {
          anomalies.push({
            description: `Recurring $${amount} charges (${txns.length} times)`,
            amount: parseFloat(amount),
            transactionId: txns[0].id
          });
        });

      // Category spending spikes
      const avgDailySpend = totalSpend / days;
      Object.entries(categoryTotals)
        .filter(([, total]) => total > avgDailySpend * 10) // Category > 10 days of average spending
        .slice(0, 2)
        .forEach(([category, total]) => {
          const categoryTxns = transactions.filter(t => t.category === category);
          anomalies.push({
            description: `High ${category} spending: ${categoryTxns.length} transactions`,
            amount: total,
            transactionId: categoryTxns[0]?.id
          });
        });

      return anomalies.slice(0, 5); // Limit to 5 anomalies
    };

    const deterministicAnomalies = detectAnomalies();

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
      const parsed = JSON.parse(cleanedText);
      
      // Normalize and validate the response
      insights = {
        summary: parsed?.summary || `You spent $${totalSpend.toFixed(2)} across ${transactionCount} transactions in the last ${days} days.`,
        topCategories: topCategories, // Always use our computed categories
        savingsOpportunities: Array.isArray(parsed?.savingsOpportunities) 
          ? parsed.savingsOpportunities
              .filter(opp => opp && typeof opp.title === 'string')
              .map(opp => ({
                title: opp.title || 'Savings Opportunity',
                description: opp.description || 'Review your spending patterns for potential savings.',
                estimatedMonthlySavings: Math.min(Math.max(opp.estimatedMonthlySavings || 0, 0), totalSpend / 2)
              }))
          : [],
        anomalies: [...deterministicAnomalies, ...(Array.isArray(parsed?.anomalies)
          ? parsed.anomalies
              .filter(anomaly => anomaly && typeof anomaly.description === 'string')
              .map(anomaly => ({
                description: anomaly.description || 'Pattern detected',
                date: anomaly.date || undefined,
                amount: typeof anomaly.amount === 'number' ? anomaly.amount : undefined
              }))
          : [])].slice(0, 6), // Combine deterministic + AI anomalies, limit to 6
        notes: parsed?.notes || undefined
      };
      
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', responseText);
      // Fallback response with normalized structure
      insights = {
        summary: `You spent $${totalSpend.toFixed(2)} across ${transactionCount} transactions in the last ${days} days.`,
        topCategories,
        savingsOpportunities: [],
        anomalies: deterministicAnomalies, // Use deterministic anomalies as fallback
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
    
    // Sanitize error message
    let sanitizedError = 'Service temporarily unavailable';
    if (error.message?.includes('Rate limit') || error.message?.includes('Unauthorized')) {
      sanitizedError = error.message;
    } else if (error.message?.includes('AI service')) {
      sanitizedError = 'AI service temporarily unavailable';
    }
    
    return new Response(
      JSON.stringify({ 
        error: sanitizedError,
        details: 'Failed to generate spending insights'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});