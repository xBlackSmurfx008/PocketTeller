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

    // Get user's financial context
    const [
      { data: budget },
      { data: goals },
      { data: transactions },
      { data: accounts }
    ] = await Promise.all([
      supabase.from('budget').select('*').eq('user_id', user.id).single(),
      supabase.from('goals').select('*').eq('user_id', user.id),
      supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(10),
      supabase.from('accounts').select('*').eq('user_id', user.id)
    ]);

    // Build context for Gemini
    const financialContext = {
      budget: budget || null,
      goals: goals || [],
      recent_transactions: transactions || [],
      accounts: accounts || []
    };

    // Prepare the conversation for Gemini
    const systemPrompt = `You are a helpful financial assistant. You have access to the user's financial data and can help them with budgeting, goal setting, and financial planning.

Current Financial Context:
- Budget: ${JSON.stringify(financialContext.budget)}
- Goals: ${JSON.stringify(financialContext.goals)}
- Recent Transactions: ${JSON.stringify(financialContext.recent_transactions)}
- Accounts: ${JSON.stringify(financialContext.accounts)}

You can help users:
1. Create and update financial goals
2. Adjust their budget categories
3. Analyze spending patterns
4. Provide financial advice

When users want to set goals or update budgets, use the appropriate function calls to update their data.`;

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
              description: 'Test Plaid API connection and generate sample transaction data',
              parameters: {
                type: 'object',
                properties: {
                  generate_sample_data: { 
                    type: 'boolean', 
                    description: 'Whether to generate sample transaction data after testing' 
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
              // Generate sample transactions
              const sampleTransactions = [
                {
                  user_id: user.id,
                  description: 'Grocery Store Purchase',
                  amount: -85.43,
                  category: 'Food',
                  date: new Date().toISOString().split('T')[0],
                  transaction_id: `demo_${Date.now()}_1`
                },
                {
                  user_id: user.id,
                  description: 'Salary Deposit',
                  amount: 3500.00,
                  category: 'Income',
                  date: new Date().toISOString().split('T')[0],
                  transaction_id: `demo_${Date.now()}_2`
                },
                {
                  user_id: user.id,
                  description: 'Electric Bill',
                  amount: -125.67,
                  category: 'Utilities',
                  date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
                  transaction_id: `demo_${Date.now()}_3`
                }
              ];
              
              await supabase.from('transactions').insert(sampleTransactions);
              console.log('Sample transactions created');
            }
            
            assistantMessage += `\n\nPlaid Test Results: ${plaidResult.success ? 'SUCCESS' : 'FAILED'}`;
            if (generate_sample_data && plaidResult.success) {
              assistantMessage += '\nSample transaction data has been generated for demonstration.';
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