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
    const { message, conversation_history = [], attachments = [], thread_id, coach_mode = false } = await req.json();
    
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
      { data: recentTransactions },
      { data: aiGuides }
    ] = await Promise.all([
      supabase.from('budget').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('goals').select('*').eq('user_id', user.id),
      // Get all transactions for comprehensive analysis (24 months max)
      supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(2000),
      supabase.from('accounts').select('*').eq('user_id', user.id),
      // Recent transactions for quick context
      supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(20),
      // Get AI guides for enhanced coaching
      supabase.from('ai_guides').select('*').eq('is_active', true)
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

    // Enhanced system prompt with coaching capabilities
    let systemPrompt = `You are an advanced financial assistant capable of analyzing up to 24 months of transaction data to provide comprehensive insights, detailed reporting, and personalized money management advice. You excel at identifying long-term trends, seasonal patterns, and creating sophisticated budgets based on extensive historical data.

FORMATTING RULES:
- Use plain text only, no markdown formatting
- Do not use asterisks (*) for emphasis or bold text
- Use CAPS for emphasis when needed
- Use clear, readable plain text formatting

CURRENT FINANCIAL CONTEXT:
- Budget: ${JSON.stringify(financialContext.budget)}
- Goals: ${JSON.stringify(financialContext.goals)}
- Recent Transactions (last 20): ${JSON.stringify(financialContext.recent_transactions)}
- Accounts: ${JSON.stringify(financialContext.accounts)}

COMPREHENSIVE 24-MONTH FINANCIAL ANALYSIS:
CURRENT STATUS:
- Total Account Balance: $${financialAnalysis.totalBalance.toFixed(2)}
- Total Transactions Analyzed: ${financialAnalysis.totalTransactionCount}
- Last Transaction: ${financialAnalysis.lastTransactionDate}
- Has Long-term Data: ${financialAnalysis.hasLongTermData}

MONTHLY AVERAGES (24-month basis):
- Average Monthly Income: $${financialAnalysis.monthlyAverages.income.toFixed(2)}
- Average Monthly Expenses: $${financialAnalysis.monthlyAverages.expenses.toFixed(2)}
- Average Monthly Net Flow: $${financialAnalysis.monthlyAverages.netFlow.toFixed(2)}

PERIOD COMPARISONS:
- Last Month: Income $${financialAnalysis.currentMonth.income.toFixed(2)}, Expenses $${financialAnalysis.currentMonth.expenses.toFixed(2)}, Net $${financialAnalysis.currentMonth.netFlow.toFixed(2)}
- Last 3 Months: Income $${financialAnalysis.last3Months.income.toFixed(2)}, Expenses $${financialAnalysis.last3Months.expenses.toFixed(2)}, Net $${financialAnalysis.last3Months.netFlow.toFixed(2)}
- Last Year: Income $${financialAnalysis.lastYear.income.toFixed(2)}, Expenses $${financialAnalysis.lastYear.expenses.toFixed(2)}, Net $${financialAnalysis.lastYear.netFlow.toFixed(2)}
- Last 24 Months: Income $${financialAnalysis.last24Months.income.toFixed(2)}, Expenses $${financialAnalysis.last24Months.expenses.toFixed(2)}, Net $${financialAnalysis.last24Months.netFlow.toFixed(2)}

SAVINGS RATES:
- 24-Month Savings Rate: ${financialAnalysis.savingsRate24Month}%
- 12-Month Savings Rate: ${financialAnalysis.savingsRateLastYear}%

GROWTH TRENDS:
- Income Growth: ${financialAnalysis.incomeGrowth}% year-over-year
- Expense Growth: ${financialAnalysis.expenseGrowth}% year-over-year

SPENDING BY CATEGORIES (Recent):
${JSON.stringify(financialAnalysis.currentMonth.categorySpending)}

CRITICAL ASSESSMENT:
- Has Transactions: ${financialAnalysis.hasTransactions}
- Has Budget: ${financialAnalysis.hasBudget}
- Needs Budget: ${financialAnalysis.needsBudget}
- Has Long-term Data: ${financialAnalysis.hasLongTermData}`;

    // Add coaching knowledge base if coach mode is enabled
    if (coach_mode && aiGuides && aiGuides.length > 0) {
      const budgetingGuide = aiGuides.find(guide => 
        guide.tags?.includes('budgeting') || guide.tags?.includes('coach')
      );
      
      if (budgetingGuide) {
        systemPrompt += `

COACHING MODE ENABLED - ENHANCED BUDGETING KNOWLEDGE:

You now have access to a comprehensive budgeting education guide. Use this knowledge to:
1. Assess the user's current financial literacy level (beginner/intermediate/advanced)
2. Provide educational content appropriate to their level
3. Ask guided questions that help them reflect on their financial habits
4. Suggest practical exercises to build better money management skills
5. Offer step-by-step coaching through budgeting challenges

BUDGETING EDUCATION GUIDE:
${budgetingGuide.content}

COACHING APPROACH:
- Start by assessing their current knowledge level through gentle questions
- Provide education before diving into complex analysis
- Use the key questions from the guide to prompt self-reflection
- Suggest practical exercises that match their skill level
- Be encouraging and non-judgmental
- Guide them through a progressive learning journey
- Reference specific sections of the guide when relevant

When coach mode is active, prioritize education and skill-building over just providing answers. Help them learn to fish rather than just giving them fish.`;
      }
    }

    systemPrompt += `

MANDATORY ACTIONS FOR 24-MONTH DATA:
1. COMPREHENSIVE TREND ANALYSIS: Identify seasonal patterns, growth trends, and spending changes over time
2. AUTO-CREATE SOPHISTICATED BUDGET: If user has substantial data but no budget, create one based on 24-month averages and trends
3. SEASONAL INSIGHTS: Analyze spending patterns by month/season to identify recurring trends
4. YEAR-OVER-YEAR COMPARISON: Compare current vs previous year performance
5. PREDICTIVE RECOMMENDATIONS: Use historical data to suggest future financial strategies

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
3. analyze_finances: Provide structured financial analysis with trend insights and long-term recommendations

CONVERSATION STYLE:
- Leverage the depth of 24-month data for sophisticated insights
- Provide specific trend analysis with percentages and growth rates
- Offer concrete recommendations based on historical patterns
- Explain seasonal variations and their impact on budgeting
- Use year-over-year comparisons to show progress
- Highlight both positive trends and areas needing attention
${coach_mode ? '- In coach mode: Focus on education, ask guiding questions, and provide step-by-step learning' : ''}

CRITICAL: With 24 months of data, provide sophisticated analysis including seasonal trends, year-over-year growth, spending pattern evolution, and data-driven budget recommendations. Always mention the time period being analyzed to show the depth of insights.`;

    // Process attachments for Gemini
    const geminiParts = [{ text: message }];
    
    if (attachments && attachments.length > 0) {
      console.log(`Processing ${attachments.length} attachments`);
      
      for (const attachment of attachments) {
        try {
          // Extract file path from URL (handle both signed URLs and direct paths)
          let filePath = attachment.url;
          
          // If it's a signed URL, extract the file path
          if (attachment.url.includes('chat-uploads/')) {
            const urlParts = attachment.url.split('chat-uploads/');
            if (urlParts.length > 1) {
              filePath = urlParts[1].split('?')[0]; // Remove query parameters
            }
          }
          
          console.log(`Processing attachment: ${attachment.name}, type: ${attachment.type}, path: ${filePath}`);
          
          // Download file from Supabase Storage
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('chat-uploads')
            .download(filePath);
            
          if (downloadError) {
            console.error('Error downloading file:', downloadError);
            continue;
          }
          
          if (attachment.type.startsWith('image/')) {
            // Process images for Gemini vision
            const buffer = await fileData.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
            
            geminiParts.push({
              inline_data: {
                mime_type: attachment.type,
                data: base64
              }
            });
            console.log(`Added image to Gemini parts: ${attachment.name}`);
            
          } else if (attachment.type === 'application/pdf') {
            // Upload PDF to Gemini Files API for processing
            const buffer = await fileData.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
            
            const uploadResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/files?key=${geminiApiKey}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                file: {
                  display_name: attachment.name,
                  mime_type: attachment.type
                }
              })
            });
            
            const uploadResult = await uploadResponse.json();
            
            if (uploadResult.file?.uri) {
              // Upload the actual file content
              const contentResponse = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files/${uploadResult.file.name}?key=${geminiApiKey}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': attachment.type,
                },
                body: buffer
              });
              
              if (contentResponse.ok) {
                geminiParts.push({
                  file_data: {
                    mime_type: attachment.type,
                    file_uri: uploadResult.file.uri
                  }
                });
                console.log(`Added PDF to Gemini parts: ${attachment.name}`);
              }
            }
            
          } else if (attachment.type.startsWith('text/') || 
                     attachment.type === 'application/json' || 
                     attachment.type === 'text/csv') {
            // Process text-based files by adding content directly to message
            const text = await fileData.text();
            
            // Limit text content to prevent overwhelming Gemini
            const truncatedText = text.length > 2000 ? text.substring(0, 2000) + '...' : text;
            
            geminiParts.push({
              text: `\n\nFile: ${attachment.name}\nContent:\n${truncatedText}`
            });
            console.log(`Added text file to Gemini parts: ${attachment.name}`);
          }
          
        } catch (error) {
          console.error('Error processing attachment:', attachment.name, error);
        }
      }
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversation_history.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message, parts: geminiParts }
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
          parts: msg.parts || [{ text: msg.content }]
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
          response_mime_type: "text/plain"
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
    // Don't log full Gemini response for security
    console.log('Gemini response received successfully');

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

    // Sanitize assistant message to remove any remaining markdown formatting
    assistantMessage = assistantMessage.replace(/\*\*/g, '').replace(/\*/g, '');

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
          console.log('Goal created successfully');
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
          console.log('Budget updated successfully');
        } else if (name === 'analyze_finances') {
          const { analysis_type = 'comprehensive' } = args;
          
          // Provide structured analysis based on current financial data
          const analysisResult = {
            analysis_type,
            timestamp: new Date().toISOString(),
            financial_health_score: financialAnalysis.savingsRate24Month > 20 ? 'Excellent' : 
                                   financialAnalysis.savingsRate24Month > 10 ? 'Good' : 
                                   financialAnalysis.savingsRate24Month > 0 ? 'Fair' : 'Needs Improvement',
            insights: {
              monthly_averages: financialAnalysis.monthlyAverages,
              savings_rate_24m: `${financialAnalysis.savingsRate24Month}%`,
              savings_rate_12m: `${financialAnalysis.savingsRateLastYear}%`,
              total_balance: financialAnalysis.totalBalance,
              category_spending: financialAnalysis.currentMonth.categorySpending
            },
            recommendations: []
          };
          
          assistantMessage += `\n\n📊 FINANCIAL ANALYSIS COMPLETE:\n- Health Score: ${analysisResult.financial_health_score}\n- 24-Month Savings Rate: ${financialAnalysis.savingsRate24Month}%\n- Monthly Net Flow (avg): $${financialAnalysis.monthlyAverages.netFlow.toFixed(2)}\n- Total Balance: $${financialAnalysis.totalBalance.toFixed(2)}`;
          
          console.log('Financial analysis completed successfully');
        }
      } catch (error) {
        console.error('Function call error:', error);
      }
    }

    // Validate thread ownership if thread_id is provided
    if (thread_id) {
      const { data: thread, error: threadError } = await supabase
        .from('conversation_threads')
        .select('user_id')
        .eq('id', thread_id)
        .single();
      
      if (threadError || !thread || thread.user_id !== user.id) {
        throw new Error('Invalid thread ID or access denied');
      }
    }

    // Save conversation to database
    await Promise.all([
      supabase.from('conversations').insert({
        user_id: user.id,
        thread_id: thread_id || null,
        role: 'user',
        message: message,
        attachments: attachments || []
      }),
      supabase.from('conversations').insert({
        user_id: user.id,
        thread_id: thread_id || null,
        role: 'assistant',
        message: assistantMessage,
        attachments: []
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
