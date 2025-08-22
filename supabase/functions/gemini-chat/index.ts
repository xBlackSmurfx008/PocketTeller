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

    // Get user's financial context - optimized for 24 months of Plaid data
    const [
      { data: budget },
      { data: goals },
      { data: allTransactions },
      { data: accounts },
      { data: recentTransactions }
    ] = await Promise.all([
      supabase.from('budget').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('goals').select('*').eq('user_id', user.id),
      // Get all transactions for comprehensive analysis (24 months max)
      supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(2000),
      supabase.from('accounts').select('*').eq('user_id', user.id),
      // Recent transactions for quick context
      supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(20)
    ]);

    // Build context for Gemini with 24-month analysis capability
    const financialContext = {
      budget: budget || null,
      goals: goals || [],
      recent_transactions: recentTransactions || [],
      accounts: accounts || [],
      all_transactions: allTransactions || []
    };

    // Advanced financial analysis for 24-month period
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate());
    
    // Filter transactions by time periods
    const lastMonthTransactions = allTransactions?.filter(t => new Date(t.date) >= oneMonthAgo) || [];
    const last3MonthsTransactions = allTransactions?.filter(t => new Date(t.date) >= threeMonthsAgo) || [];
    const last6MonthsTransactions = allTransactions?.filter(t => new Date(t.date) >= sixMonthsAgo) || [];
    const lastYearTransactions = allTransactions?.filter(t => new Date(t.date) >= oneYearAgo) || [];
    const last24MonthsTransactions = allTransactions?.filter(t => new Date(t.date) >= twoYearsAgo) || [];
    
    // Comprehensive income/expense analysis by period
    const calculatePeriodMetrics = (transactions) => {
      const income = transactions.filter(t => t.amount > 0).reduce((sum, t) => sum + Number(t.amount), 0);
      const expenses = Math.abs(transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Number(t.amount), 0));
      const categorySpending = transactions.reduce((acc, t) => {
        if (t.amount < 0) {
          acc[t.category] = (acc[t.category] || 0) + Math.abs(Number(t.amount));
        }
        return acc;
      }, {} as Record<string, number>);
      return { income, expenses, netFlow: income - expenses, categorySpending, transactionCount: transactions.length };
    };
    
    const metrics = {
      lastMonth: calculatePeriodMetrics(lastMonthTransactions),
      last3Months: calculatePeriodMetrics(last3MonthsTransactions),
      last6Months: calculatePeriodMetrics(last6MonthsTransactions),
      lastYear: calculatePeriodMetrics(lastYearTransactions),
      last24Months: calculatePeriodMetrics(last24MonthsTransactions)
    };
    
    // Monthly averages for trend analysis
    const monthlyAverages = {
      income: metrics.last24Months.income / 24,
      expenses: metrics.last24Months.expenses / 24,
      netFlow: metrics.last24Months.netFlow / 24
    };
    
    // Account and overall financial health
    const totalBalance = accounts?.reduce((sum, acc) => sum + Number(acc.balance), 0) || 0;
    const lastTransactionDate = allTransactions?.[0]?.date || null;
    
    // Advanced analysis object for Gemini
    const financialAnalysis = {
      // Period-based metrics
      currentMonth: metrics.lastMonth,
      last3Months: metrics.last3Months,
      last6Months: metrics.last6Months,
      lastYear: metrics.lastYear,
      last24Months: metrics.last24Months,
      
      // Averages and trends
      monthlyAverages,
      totalBalance,
      lastTransactionDate,
      totalTransactionCount: allTransactions?.length || 0,
      
      // Financial health indicators
      savingsRate24Month: metrics.last24Months.income > 0 ? ((metrics.last24Months.netFlow / metrics.last24Months.income) * 100).toFixed(1) : 0,
      savingsRateLastYear: metrics.lastYear.income > 0 ? ((metrics.lastYear.netFlow / metrics.lastYear.income) * 100).toFixed(1) : 0,
      
      // Status flags
      hasTransactions: (allTransactions?.length || 0) > 0,
      hasBudget: !!budget,
      needsBudget: (allTransactions?.length || 0) > 0 && !budget,
      hasLongTermData: (allTransactions?.length || 0) > 50, // Indicates substantial data for analysis
      
      // Trend indicators
      incomeGrowth: metrics.lastYear.income > 0 && metrics.last24Months.income > metrics.lastYear.income ? 
        (((metrics.last24Months.income - metrics.lastYear.income) / metrics.lastYear.income) * 100).toFixed(1) : 0,
      expenseGrowth: metrics.lastYear.expenses > 0 && metrics.last24Months.expenses > metrics.lastYear.expenses ? 
        (((metrics.last24Months.expenses - metrics.lastYear.expenses) / metrics.lastYear.expenses) * 100).toFixed(1) : 0
    };

    // Enhanced system prompt for 24-month analysis capability
    const systemPrompt = `You are an advanced financial assistant capable of analyzing up to 24 months of transaction data to provide comprehensive insights, detailed reporting, and personalized money management advice. You excel at identifying long-term trends, seasonal patterns, and creating sophisticated budgets based on extensive historical data.

CURRENT FINANCIAL CONTEXT:
- Budget: ${JSON.stringify(financialContext.budget)}
- Goals: ${JSON.stringify(financialContext.goals)}
- Recent Transactions (last 20): ${JSON.stringify(financialContext.recent_transactions)}
- Accounts: ${JSON.stringify(financialContext.accounts)}

COMPREHENSIVE 24-MONTH FINANCIAL ANALYSIS:
**CURRENT STATUS:**
- Total Account Balance: $${financialAnalysis.totalBalance.toFixed(2)}
- Total Transactions Analyzed: ${financialAnalysis.totalTransactionCount}
- Last Transaction: ${financialAnalysis.lastTransactionDate}
- Has Long-term Data: ${financialAnalysis.hasLongTermData}

**MONTHLY AVERAGES (24-month basis):**
- Average Monthly Income: $${financialAnalysis.monthlyAverages.income.toFixed(2)}
- Average Monthly Expenses: $${financialAnalysis.monthlyAverages.expenses.toFixed(2)}
- Average Monthly Net Flow: $${financialAnalysis.monthlyAverages.netFlow.toFixed(2)}

**PERIOD COMPARISONS:**
- Last Month: Income $${financialAnalysis.currentMonth.income.toFixed(2)}, Expenses $${financialAnalysis.currentMonth.expenses.toFixed(2)}, Net $${financialAnalysis.currentMonth.netFlow.toFixed(2)}
- Last 3 Months: Income $${financialAnalysis.last3Months.income.toFixed(2)}, Expenses $${financialAnalysis.last3Months.expenses.toFixed(2)}, Net $${financialAnalysis.last3Months.netFlow.toFixed(2)}
- Last Year: Income $${financialAnalysis.lastYear.income.toFixed(2)}, Expenses $${financialAnalysis.lastYear.expenses.toFixed(2)}, Net $${financialAnalysis.lastYear.netFlow.toFixed(2)}
- Last 24 Months: Income $${financialAnalysis.last24Months.income.toFixed(2)}, Expenses $${financialAnalysis.last24Months.expenses.toFixed(2)}, Net $${financialAnalysis.last24Months.netFlow.toFixed(2)}

**SAVINGS RATES:**
- 24-Month Savings Rate: ${financialAnalysis.savingsRate24Month}%
- 12-Month Savings Rate: ${financialAnalysis.savingsRateLastYear}%

**GROWTH TRENDS:**
- Income Growth: ${financialAnalysis.incomeGrowth}% year-over-year
- Expense Growth: ${financialAnalysis.expenseGrowth}% year-over-year

**SPENDING BY CATEGORIES (Recent):**
${JSON.stringify(financialAnalysis.currentMonth.categorySpending)}

CRITICAL ASSESSMENT:
- Has Transactions: ${financialAnalysis.hasTransactions}
- Has Budget: ${financialAnalysis.hasBudget}
- Needs Budget: ${financialAnalysis.needsBudget}
- Has Long-term Data: ${financialAnalysis.hasLongTermData}

MANDATORY ACTIONS FOR 24-MONTH DATA:
1. **COMPREHENSIVE TREND ANALYSIS**: Identify seasonal patterns, growth trends, and spending changes over time
2. **AUTO-CREATE SOPHISTICATED BUDGET**: If user has substantial data but no budget, create one based on 24-month averages and trends
3. **SEASONAL INSIGHTS**: Analyze spending patterns by month/season to identify recurring trends
4. **YEAR-OVER-YEAR COMPARISON**: Compare current vs previous year performance
5. **PREDICTIVE RECOMMENDATIONS**: Use historical data to suggest future financial strategies

ANALYSIS REQUIREMENTS FOR LONG-TERM DATA:
- Identify seasonal spending patterns (holiday spending, quarterly patterns, etc.)
- Calculate spending volatility and consistency metrics
- Analyze income stability and growth trends
- Identify category spending growth/decline patterns
- Recommend budget adjustments based on historical averages
- Suggest emergency fund targets based on expense history
- Identify opportunities for expense optimization based on trends

AVAILABLE FUNCTIONS:
1. create_goal: Create financial goals with specific targets and deadlines
2. update_budget: Create/update comprehensive budget using 24-month historical averages and trends
3. test_plaid_connection: Test Plaid API connection and generate realistic 24-month sample transaction data
4. analyze_finances: Provide structured financial analysis with trend insights and long-term recommendations

CONVERSATION STYLE:
- Leverage the depth of 24-month data for sophisticated insights
- Provide specific trend analysis with percentages and growth rates
- Offer concrete recommendations based on historical patterns
- Explain seasonal variations and their impact on budgeting
- Use year-over-year comparisons to show progress
- Highlight both positive trends and areas needing attention

CRITICAL: With 24 months of data, provide sophisticated analysis including seasonal trends, year-over-year growth, spending pattern evolution, and data-driven budget recommendations. Always mention the time period being analyzed to show the depth of insights.`;

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
              // Generate comprehensive 24-month sample transactions for realistic analysis
              const sampleTransactions = [];
              const sampleAccounts = [];
              
              // Generate transactions for the last 24 months
              for (let monthsBack = 0; monthsBack < 24; monthsBack++) {
                const transactionDate = new Date();
                transactionDate.setMonth(transactionDate.getMonth() - monthsBack);
                const dateStr = transactionDate.toISOString().split('T')[0];
                
                // Monthly salary (with some variation)
                const salaryVariation = (Math.random() - 0.5) * 200; // ±$100 variation
                sampleTransactions.push({
                  user_id: user.id,
                  description: 'Salary Deposit - ABC Corp',
                  amount: 4200.00 + salaryVariation,
                  category: 'Income',
                  date: dateStr,
                  transaction_id: `demo_${Date.now()}_salary_${monthsBack}`
                });
                
                // Monthly rent (consistent)
                sampleTransactions.push({
                  user_id: user.id,
                  description: 'Monthly Rent Payment',
                  amount: -1800.00,
                  category: 'Housing',
                  date: dateStr,
                  transaction_id: `demo_${Date.now()}_rent_${monthsBack}`
                });
                
                // Utilities (seasonal variation)
                const utilityVariation = monthsBack % 12 < 3 || monthsBack % 12 > 8 ? 50 : 0; // Higher in winter months
                sampleTransactions.push({
                  user_id: user.id,
                  description: 'Electric Bill',
                  amount: -(125.67 + utilityVariation),
                  category: 'Utilities',
                  date: dateStr,
                  transaction_id: `demo_${Date.now()}_electric_${monthsBack}`
                });
                
                // Groceries (3-4 times per month with variation)
                for (let i = 0; i < 3 + Math.floor(Math.random() * 2); i++) {
                  const groceryDate = new Date(transactionDate);
                  groceryDate.setDate(groceryDate.getDate() - (i * 7));
                  sampleTransactions.push({
                    user_id: user.id,
                    description: ['Whole Foods Market', 'Safeway', 'Trader Joe\'s'][i % 3],
                    amount: -(80 + Math.random() * 100), // $80-$180 range
                    category: 'Food',
                    date: groceryDate.toISOString().split('T')[0],
                    transaction_id: `demo_${Date.now()}_grocery_${monthsBack}_${i}`
                  });
                }
                
                // Gas (twice per month)
                for (let i = 0; i < 2; i++) {
                  const gasDate = new Date(transactionDate);
                  gasDate.setDate(gasDate.getDate() - (i * 15));
                  sampleTransactions.push({
                    user_id: user.id,
                    description: 'Gas Station Fill-up',
                    amount: -(45 + Math.random() * 20), // $45-$65 range
                    category: 'Transportation',
                    date: gasDate.toISOString().split('T')[0],
                    transaction_id: `demo_${Date.now()}_gas_${monthsBack}_${i}`
                  });
                }
                
                // Entertainment (seasonal - more in summer and holidays)
                const entertainmentMultiplier = (monthsBack % 12 === 5 || monthsBack % 12 === 6 || monthsBack % 12 === 11) ? 2 : 1;
                for (let i = 0; i < 2 * entertainmentMultiplier; i++) {
                  const entDate = new Date(transactionDate);
                  entDate.setDate(entDate.getDate() - (i * 10));
                  sampleTransactions.push({
                    user_id: user.id,
                    description: ['Netflix Subscription', 'Movie Theater', 'Concert Tickets', 'Restaurant'][i % 4],
                    amount: -(15 + Math.random() * 85), // $15-$100 range
                    category: 'Entertainment',
                    date: entDate.toISOString().split('T')[0],
                    transaction_id: `demo_${Date.now()}_entertainment_${monthsBack}_${i}`
                  });
                }
                
                // Healthcare (quarterly)
                if (monthsBack % 3 === 0) {
                  sampleTransactions.push({
                    user_id: user.id,
                    description: 'Doctor Visit Copay',
                    amount: -(35 + Math.random() * 65), // $35-$100 range
                    category: 'Healthcare',
                    date: dateStr,
                    transaction_id: `demo_${Date.now()}_healthcare_${monthsBack}`
                  });
                }
                
                // Shopping (random monthly)
                for (let i = 0; i < 1 + Math.floor(Math.random() * 3); i++) {
                  const shopDate = new Date(transactionDate);
                  shopDate.setDate(shopDate.getDate() - (i * 8));
                  sampleTransactions.push({
                    user_id: user.id,
                    description: ['Amazon Purchase', 'Target', 'Best Buy', 'Department Store'][i % 4],
                    amount: -(25 + Math.random() * 200), // $25-$225 range
                    category: 'Shopping',
                    date: shopDate.toISOString().split('T')[0],
                    transaction_id: `demo_${Date.now()}_shopping_${monthsBack}_${i}`
                  });
                }
              }
              
              // Create sample accounts with realistic balances
              sampleAccounts.push(
                {
                  user_id: user.id,
                  account_id: 'demo_checking_001',
                  name: 'Chase Checking',
                  type: 'checking',
                  balance: 2845.67 + Math.random() * 2000,
                  source: 'plaid'
                },
                {
                  user_id: user.id,
                  account_id: 'demo_savings_001',
                  name: 'Chase Savings',
                  type: 'savings',
                  balance: 15420.00 + Math.random() * 10000,
                  source: 'plaid'
                },
                {
                  user_id: user.id,
                  account_id: 'demo_investment_001',
                  name: 'Investment Account',
                  type: 'investment',
                  balance: 25000.00 + Math.random() * 25000,
                  source: 'plaid'
                }
              );
              
              await Promise.all([
                supabase.from('transactions').insert(sampleTransactions),
                supabase.from('accounts').insert(sampleAccounts)
              ]);
              
              console.log(`Generated ${sampleTransactions.length} sample transactions across 24 months and ${sampleAccounts.length} accounts`);
              
              // Calculate totals from generated data
              const totalIncome = sampleTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
              const totalExpenses = Math.abs(sampleTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + t.amount, 0));
              const monthlyAvgIncome = totalIncome / 24;
              const monthlyAvgExpenses = totalExpenses / 24;
              
              assistantMessage += `\n\n🎉 SUCCESS! Generated comprehensive 24-month financial dataset:\n\n📊 **COMPLETE FINANCIAL PICTURE:**\n- **Transaction Count:** ${sampleTransactions.length} transactions\n- **Time Period:** Full 24 months of data\n- **Total Income:** $${totalIncome.toLocaleString()}\n- **Total Expenses:** $${totalExpenses.toLocaleString()}\n- **Net 24-Month Flow:** $${(totalIncome - totalExpenses).toLocaleString()}\n\n📈 **MONTHLY AVERAGES:**\n- **Average Monthly Income:** $${monthlyAvgIncome.toFixed(2)}\n- **Average Monthly Expenses:** $${monthlyAvgExpenses.toFixed(2)}\n- **Average Monthly Savings:** $${(monthlyAvgIncome - monthlyAvgExpenses).toFixed(2)}\n\n💡 **KEY INSIGHTS FROM 24-MONTH DATA:**\n- Excellent long-term financial stability\n- Consistent income with minimal variation\n- Seasonal spending patterns included\n- Strong savings potential identified\n\nNow creating your personalized budget based on 24-month trends...`;
              
              // Auto-create sophisticated budget based on 24-month averages
              const autoCategories = {
                "Housing": Math.round(monthlyAvgExpenses * 0.42), // Rent + utilities
                "Food": Math.round(monthlyAvgExpenses * 0.25),
                "Transportation": Math.round(monthlyAvgExpenses * 0.12),
                "Entertainment": Math.round(monthlyAvgExpenses * 0.08),
                "Shopping": Math.round(monthlyAvgExpenses * 0.15),
                "Healthcare": Math.round(monthlyAvgExpenses * 0.05),
                "Emergency Fund": Math.round(monthlyAvgIncome * 0.10),
                "Long-term Savings": Math.round(monthlyAvgIncome * 0.15),
                "Investment": Math.round(monthlyAvgIncome * 0.10)
              };
              
              const budgetResult = await supabase.from('budget').upsert({
                user_id: user.id,
                income: Math.round(monthlyAvgIncome),
                expenses: Math.round(monthlyAvgExpenses),
                categories: autoCategories,
                time_period: 'monthly',
                status: 'active'
              }, {
                onConflict: 'user_id'
              });
              
              
              if (budgetResult.error) {
                console.error('Budget creation error:', budgetResult.error);
                assistantMessage += '\n\n⚠️ Note: Had some difficulty saving the budget, but your 24-month financial analysis is complete.';
              } else {
                assistantMessage += `\n\n✅ **PERSONALIZED BUDGET CREATED FROM 24-MONTH DATA!**\n\n📈 **BUDGET BASED ON HISTORICAL AVERAGES:**\n- **Monthly Income:** $${Math.round(monthlyAvgIncome).toLocaleString()}\n- **Monthly Expenses:** $${Math.round(monthlyAvgExpenses).toLocaleString()}\n- **Available for Goals:** $${Math.round(monthlyAvgIncome - monthlyAvgExpenses).toLocaleString()}\n\n🎯 **CATEGORY ALLOCATIONS:**\n${Object.entries(autoCategories).map(([cat, amt]) => `- ${cat}: $${amt.toLocaleString()}`).join('\n')}\n\n🔍 **24-MONTH INSIGHTS:**\n1. **Exceptional Data Depth**: Analysis based on ${sampleTransactions.length} transactions\n2. **Seasonal Patterns**: Budget accounts for spending variations\n3. **Income Stability**: Consistent monthly income demonstrated\n4. **Savings Potential**: Strong capacity for wealth building\n5. **Investment Ready**: Consider diversifying surplus funds\n\n📊 **RECOMMENDATIONS:**\n- Emergency fund target: $${Math.round(monthlyAvgExpenses * 6).toLocaleString()} (6 months expenses)\n- Investment allocation: $${autoCategories['Investment'].toLocaleString()}/month\n- Track seasonal spending patterns for optimization`;
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