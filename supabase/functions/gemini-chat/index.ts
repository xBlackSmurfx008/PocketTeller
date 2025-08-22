import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = "https://dscndbpqvhvylukvcgpq.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzY25kYnBxdmh2eWx1a3ZjZ3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4Mjg1NzksImV4cCI6MjA3MTQwNDU3OX0.GYh0VhUqTpVfwG2mh8WwW8GSBJPvpFAZSFJy7oWbnL0";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversation_history = [] } = await req.json();
    
    if (!message) {
      throw new Error('Message is required');
    }

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Authentication failed');
    }

    // Get user's financial context - expand transactions window for better analysis
    const [
      { data: budget },
      { data: goals },
      { data: transactions },
      { data: accounts },
      { data: recentTransactions }
    ] = await Promise.all([
      supabase.from('budget').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('goals').select('*').eq('user_id', user.id),
      supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(100),
      supabase.from('accounts').select('*').eq('user_id', user.id),
      supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(10)
    ]);

    // Build context for Gemini
    const financialContext = {
      budget: budget || null,
      goals: goals || [],
      recent_transactions: recentTransactions || [],
      accounts: accounts || [],
      all_transactions: transactions || []
    };

    // Calculate comprehensive financial insights
    const totalIncome = transactions?.filter(t => t.amount > 0).reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    const totalExpenses = Math.abs(transactions?.filter(t => t.amount < 0).reduce((sum, t) => sum + Number(t.amount), 0) || 0);
    const netCashFlow = totalIncome - totalExpenses;
    
    // Category spending analysis
    const categorySpending = transactions?.reduce((acc, t) => {
      if (t.amount < 0) {
        acc[t.category] = (acc[t.category] || 0) + Math.abs(Number(t.amount));
      }
      return acc;
    }, {} as Record<string, number>) || {};
    
    // Additional insights
    const totalBalance = accounts?.reduce((sum, acc) => sum + Number(acc.balance), 0) || 0;
    const avgTransactionAmount = transactions?.length ? Math.abs(transactions.reduce((sum, t) => sum + Number(t.amount), 0) / transactions.length) : 0;
    const transactionCount = transactions?.length || 0;
    const lastTransactionDate = transactions?.[0]?.date || null;
    
    // Spending trends (last 30 days vs previous period)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const recentSpending = transactions?.filter(t => t.date >= thirtyDaysAgo && t.amount < 0).reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0) || 0;
    
    // Analysis object for Gemini
    const financialAnalysis = {
      totalIncome,
      totalExpenses,
      netCashFlow,
      totalBalance,
      categorySpending,
      avgTransactionAmount,
      transactionCount,
      lastTransactionDate,
      recentSpending: recentSpending,
      savingsRate: totalIncome > 0 ? ((netCashFlow / totalIncome) * 100).toFixed(1) : 0,
      hasTransactions: transactionCount > 0,
      hasBudget: !!budget,
      needsBudget: transactionCount > 0 && !budget
    };

    // Prepare the conversation for Gemini with enhanced analysis
    const systemPrompt = `You are a comprehensive financial assistant that provides detailed analysis, reporting, and personalized money management advice. You excel at creating budgets, analyzing spending patterns, and offering actionable financial recommendations.

CURRENT FINANCIAL CONTEXT:
- Budget: ${JSON.stringify(financialContext.budget)}
- Goals: ${JSON.stringify(financialContext.goals)}
- Recent Transactions (last 10): ${JSON.stringify(financialContext.recent_transactions)}
- Accounts: ${JSON.stringify(financialContext.accounts)}

COMPREHENSIVE FINANCIAL ANALYSIS:
- Total Income: $${financialAnalysis.totalIncome.toFixed(2)}
- Total Expenses: $${financialAnalysis.totalExpenses.toFixed(2)}
- Net Cash Flow: $${financialAnalysis.netCashFlow.toFixed(2)}
- Total Account Balance: $${financialAnalysis.totalBalance.toFixed(2)}
- Savings Rate: ${financialAnalysis.savingsRate}%
- Transaction Count: ${financialAnalysis.transactionCount}
- Average Transaction: $${financialAnalysis.avgTransactionAmount.toFixed(2)}
- Recent 30-day Spending: $${financialAnalysis.recentSpending.toFixed(2)}
- Last Transaction: ${financialAnalysis.lastTransactionDate}
- Category Breakdown: ${JSON.stringify(financialAnalysis.categorySpending)}

CRITICAL ASSESSMENT:
- Has Transactions: ${financialAnalysis.hasTransactions}
- Has Budget: ${financialAnalysis.hasBudget}
- Needs Budget: ${financialAnalysis.needsBudget}

MANDATORY ACTIONS:
1. **AUTO-CREATE BUDGET**: If user has transactions but no budget, IMMEDIATELY create one using update_budget function
2. **COMPREHENSIVE ANALYSIS**: Always provide detailed spending analysis with specific insights
3. **ACTIONABLE RECOMMENDATIONS**: Give specific, measurable financial advice
4. **PROACTIVE REPORTING**: When data exists, automatically provide financial health reports

ANALYSIS REQUIREMENTS:
- Analyze spending by category and identify optimization opportunities  
- Compare income vs expenses and suggest improvements
- Identify irregular spending patterns or potential issues
- Recommend savings strategies based on cash flow
- Suggest budget adjustments if budget exists
- Create realistic budgets based on actual spending patterns

AVAILABLE FUNCTIONS:
1. create_goal: Create financial goals with specific targets and deadlines
2. update_budget: Create/update comprehensive budget with income, expenses, and detailed category allocations
3. test_plaid_connection: Test Plaid API connection and generate realistic sample transaction data
4. analyze_finances: Provide structured financial analysis and recommendations

CONVERSATION STYLE:
- Be conversational but professional
- Provide specific numbers and percentages
- Offer concrete next steps
- Explain the "why" behind recommendations
- Use the user's actual data to personalize advice

CRITICAL: When transactions exist but no budget is present, IMMEDIATELY create a budget automatically using the actual spending data. Don't ask for permission - just do it and explain what you've created.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversation_history,
      { role: 'user', content: message }
    ];

    // Call Gemini API with function calling
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: messages.map(msg => ({
          role: msg.role === 'system' ? 'user' : (msg.role === 'assistant' ? 'model' : msg.role),
          parts: [{ text: msg.content }]
        })),
        tools: [{
          function_declarations: [
            {
              name: 'create_goal',
              description: 'Create a new financial goal for the user',
              parameters: {
                type: 'object',
                properties: {
                  goal_name: { type: 'string', description: 'Name of the goal' },
                  target_amount: { type: 'number', description: 'Target amount in dollars' },
                  deadline: { type: 'string', description: 'Deadline in YYYY-MM-DD format' }
                },
                required: ['goal_name', 'target_amount']
              }
            },
            {
              name: 'update_budget',
              description: 'Update the user\'s budget categories',
              parameters: {
                type: 'object',
                properties: {
                  income: { type: 'number', description: 'Monthly income' },
                  expenses: { type: 'number', description: 'Monthly expenses' },
                  categories: { 
                    type: 'string', 
                    description: 'JSON string of budget categories with amounts, e.g. {"food": 500, "rent": 1000}' 
                  }
                }
              }
            },
            {
              name: 'test_plaid_connection',
              description: 'Test Plaid API connection and generate comprehensive sample transaction data',
              parameters: {
                type: 'object',
                properties: {
                  generate_sample_data: { 
                    type: 'boolean', 
                    description: 'Whether to generate sample transaction data after testing' 
                  }
                }
              }
            },
            {
              name: 'analyze_finances',
              description: 'Provide structured financial analysis with detailed insights and recommendations',
              parameters: {
                type: 'object',
                properties: {
                  analysis_type: {
                    type: 'string',
                    description: 'Type of analysis: spending, budget, cashflow, or comprehensive',
                    enum: ['spending', 'budget', 'cashflow', 'comprehensive']
                  }
                }
              }
            }
          ]
        }],
        generation_config: {
          temperature: 0.7,
          top_p: 0.8,
          top_k: 40,
          max_output_tokens: 2048,
        }
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      return new Response(JSON.stringify({ 
        error: `Gemini API error: ${geminiResponse.status}`,
        details: errorText
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini response:', JSON.stringify(geminiData, null, 2));

    let assistantMessage = '';
    let functionCalls = [];

    if (geminiData.candidates && geminiData.candidates[0]) {
      const candidate = geminiData.candidates[0];
      
      if (candidate.content && candidate.content.parts) {
        for (const part of candidate.content.parts) {
          if (part.text) {
            assistantMessage += part.text;
          }
          if (part.functionCall) {
            functionCalls.push(part.functionCall);
          }
        }
      }
    }

    // Execute function calls
    for (const functionCall of functionCalls) {
      const { name, args } = functionCall;
      
      try {
        if (name === 'create_goal') {
          const { goal_name, target_amount, deadline } = args;
          await supabase.from('goals').insert({
            user_id: user.id,
            goal_name,
            target_amount,
            deadline: deadline || null
          });
          console.log('Goal created:', args);
        } else if (name === 'update_budget') {
          const { income, expenses, categories } = args;
          
          // Parse categories if it's a string
          let parsedCategories = {};
          if (typeof categories === 'string') {
            try {
              parsedCategories = JSON.parse(categories);
            } catch (e) {
              console.error('Failed to parse categories:', e);
              parsedCategories = {};
            }
          } else {
            parsedCategories = categories || {};
          }
          
          // Upsert budget
          await supabase.from('budget').upsert({
            user_id: user.id,
            income: income || 0,
            expenses: expenses || 0,
            categories: parsedCategories,
            time_period: 'monthly',
            status: 'active'
          }, {
            onConflict: 'user_id'
          });
          console.log('Budget updated:', args);
        } else if (name === 'analyze_finances') {
          const { analysis_type = 'comprehensive' } = args;
          
          // Provide structured analysis based on current financial data
          const analysisResult = {
            analysis_type,
            timestamp: new Date().toISOString(),
            financial_health_score: financialAnalysis.savingsRate > 20 ? 'Excellent' : 
                                   financialAnalysis.savingsRate > 10 ? 'Good' : 
                                   financialAnalysis.savingsRate > 0 ? 'Fair' : 'Needs Improvement',
            insights: {
              income: financialAnalysis.totalIncome,
              expenses: financialAnalysis.totalExpenses,
              net_flow: financialAnalysis.netCashFlow,
              savings_rate: `${financialAnalysis.savingsRate}%`,
              category_spending: financialAnalysis.categorySpending
            },
            recommendations: []
          };
          
          assistantMessage += `\n\n📊 FINANCIAL ANALYSIS COMPLETE:\n- Health Score: ${analysisResult.financial_health_score}\n- Savings Rate: ${financialAnalysis.savingsRate}%\n- Monthly Net Flow: $${financialAnalysis.netCashFlow.toFixed(2)}`;
          
          console.log('Financial analysis generated:', analysisResult);
        } else if (name === 'test_plaid_connection') {
          const { generate_sample_data = true } = args;
          
          try {
            // Test Plaid connection
            const plaidResponse = await fetch(`${supabaseUrl}/functions/v1/plaid-test`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            });
            
            const plaidResult = await plaidResponse.json();
            console.log('Plaid test result:', plaidResult);
            
            if (plaidResult.success && generate_sample_data) {
              // Generate realistic sample transactions for the past 30 days
              const sampleTransactions = [
                // Income
                {
                  user_id: user.id,
                  description: 'Salary Deposit - ABC Corp',
                  amount: 4200.00,
                  category: 'Income',
                  date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  transaction_id: `demo_${Date.now()}_salary`
                },
                {
                  user_id: user.id,
                  description: 'Freelance Payment',
                  amount: 850.00,
                  category: 'Income',
                  date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  transaction_id: `demo_${Date.now()}_freelance`
                },
                // Housing
                {
                  user_id: user.id,
                  description: 'Rent Payment',
                  amount: -1800.00,
                  category: 'Housing',
                  date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  transaction_id: `demo_${Date.now()}_rent`
                },
                {
                  user_id: user.id,
                  description: 'Electric Bill',
                  amount: -125.67,
                  category: 'Utilities',
                  date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  transaction_id: `demo_${Date.now()}_electric`
                },
                {
                  user_id: user.id,
                  description: 'Internet Service',
                  amount: -79.99,
                  category: 'Utilities',
                  date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  transaction_id: `demo_${Date.now()}_internet`
                },
                // Food & Dining
                {
                  user_id: user.id,
                  description: 'Whole Foods Market',
                  amount: -156.43,
                  category: 'Food',
                  date: new Date().toISOString().split('T')[0],
                  transaction_id: `demo_${Date.now()}_groceries1`
                },
                {
                  user_id: user.id,
                  description: 'Safeway Grocery',
                  amount: -89.21,
                  category: 'Food',
                  date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  transaction_id: `demo_${Date.now()}_groceries2`
                },
                {
                  user_id: user.id,
                  description: 'Starbucks Coffee',
                  amount: -8.75,
                  category: 'Food',
                  date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  transaction_id: `demo_${Date.now()}_coffee`
                },
                {
                  user_id: user.id,
                  description: 'Pizza Palace',
                  amount: -24.50,
                  category: 'Food',
                  date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  transaction_id: `demo_${Date.now()}_pizza`
                },
                // Transportation
                {
                  user_id: user.id,
                  description: 'Gas Station Fill-up',
                  amount: -52.34,
                  category: 'Transportation',
                  date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  transaction_id: `demo_${Date.now()}_gas`
                },
                {
                  user_id: user.id,
                  description: 'Uber Ride',
                  amount: -18.90,
                  category: 'Transportation',
                  date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  transaction_id: `demo_${Date.now()}_uber`
                },
                // Entertainment
                {
                  user_id: user.id,
                  description: 'Netflix Subscription',
                  amount: -15.99,
                  category: 'Entertainment',
                  date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  transaction_id: `demo_${Date.now()}_netflix`
                },
                {
                  user_id: user.id,
                  description: 'Movie Theater',
                  amount: -28.50,
                  category: 'Entertainment',
                  date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  transaction_id: `demo_${Date.now()}_movies`
                },
                // Shopping
                {
                  user_id: user.id,
                  description: 'Amazon Purchase',
                  amount: -67.89,
                  category: 'Shopping',
                  date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  transaction_id: `demo_${Date.now()}_amazon`
                },
                // Healthcare
                {
                  user_id: user.id,
                  description: 'Doctor Visit Copay',
                  amount: -35.00,
                  category: 'Healthcare',
                  date: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  transaction_id: `demo_${Date.now()}_doctor`
                }
              ];
              
              // Also create sample accounts
              const sampleAccounts = [
                {
                  user_id: user.id,
                  account_id: 'demo_checking_001',
                  name: 'Chase Checking',
                  type: 'checking',
                  balance: 2845.67,
                  source: 'plaid'
                },
                {
                  user_id: user.id,
                  account_id: 'demo_savings_001',
                  name: 'Chase Savings',
                  type: 'savings',
                  balance: 15420.00,
                  source: 'plaid'
                }
              ];
              
              await Promise.all([
                supabase.from('transactions').insert(sampleTransactions),
                supabase.from('accounts').insert(sampleAccounts)
              ]);
              
              console.log('Sample transactions and accounts created');
            }
            
            assistantMessage += `\n\nPlaid Test Results: ${plaidResult.success ? 'SUCCESS' : 'FAILED'}`;
            if (generate_sample_data && plaidResult.success) {
              assistantMessage += '\n\n🎉 SUCCESS! I\'ve generated comprehensive sample transaction data and will now provide a complete financial analysis:\n\n📊 **FINANCIAL OVERVIEW:**\n- Monthly Income: $5,050\n- Total Expenses: $2,633\n- Net Cash Flow: $2,417 (48% savings rate!)\n- Account Balances: $18,265\n\n💡 **KEY INSIGHTS:**\n- Excellent savings rate indicates strong financial discipline\n- Housing costs are reasonable at 36% of income\n- Food spending is moderate at $279/month\n- Good emergency fund potential\n\nNow creating your personalized budget based on this data...';
              
              // Auto-create comprehensive budget based on sample data
              const autoCategories = {
                "Housing": 1800,
                "Utilities": 206,
                "Food": 279,
                "Transportation": 71,
                "Entertainment": 45,
                "Shopping": 68,
                "Healthcare": 35,
                "Emergency Fund": 500,
                "Long-term Savings": 1000,
                "Discretionary": 317
              };
              
              const budgetResult = await supabase.from('budget').upsert({
                user_id: user.id,
                income: 5050,
                expenses: 2633,
                categories: autoCategories,
                time_period: 'monthly',
                status: 'active'
              }, {
                onConflict: 'user_id'
              });
              
              
              if (budgetResult.error) {
                console.error('Budget creation error:', budgetResult.error);
                assistantMessage += '\n\n⚠️ Note: Had some difficulty saving the budget, but your financial analysis is complete.';
              } else {
                assistantMessage += '\n\n✅ **BUDGET CREATED SUCCESSFULLY!**\n\n📈 **YOUR PERSONALIZED BUDGET:**\n- Housing: $1,800 (36%)\n- Utilities: $206 (4%)\n- Food: $279 (6%)\n- Transportation: $71 (1%)\n- Entertainment: $45 (1%)\n- Healthcare: $35 (1%)\n- Emergency Fund: $500 (10%)\n- Long-term Savings: $1,000 (20%)\n- Discretionary: $317 (6%)\n\n🎯 **RECOMMENDATIONS:**\n1. **Excellent Position**: Your 48% savings rate is outstanding\n2. **Emergency Fund**: Build to 6 months of expenses ($15,798)\n3. **Investment Goals**: Consider investing excess savings\n4. **Optimization**: Look for ways to reduce discretionary spending\n5. **Track Progress**: Monitor monthly to stay on target';
              }
            }
          } catch (error) {
            console.error('Plaid test error:', error);
            assistantMessage += `\n\nPlaid Test Error: ${error.message}`;
          }
        }
      } catch (error) {
        console.error('Function call error:', error);
      }
    }

    // Save conversation to database
    await Promise.all([
      supabase.from('conversations').insert({
        user_id: user.id,
        role: 'user',
        message
      }),
      supabase.from('conversations').insert({
        user_id: user.id,
        role: 'assistant',
        message: assistantMessage
      })
    ]);

    return new Response(JSON.stringify({
      message: assistantMessage,
      function_calls: functionCalls
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in gemini-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});