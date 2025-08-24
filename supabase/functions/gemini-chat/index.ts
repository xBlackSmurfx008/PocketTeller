import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encodeBase64 as base64Encode } from "https://deno.land/std@0.224.0/encoding/base64.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = "https://dscndbpqvhvylukvcgpq.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzY25kYnBxdmh2eWx1a3ZjZ3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4Mjg1NzksImV4cCI6MjA3MTQwNDU3OX0.GYh0VhUqTpVfwG2mh8WwW8GSBJPvpFAZSFJy7oWbnL0";

// Enhanced retry logic with exponential backoff
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.log(`Attempt ${attempt + 1} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Enhanced input validation
function validateInput(data: any): { 
  message: string; 
  conversation_history: any[]; 
  attachments: any[]; 
  thread_id?: string; 
  coach_mode: boolean; 
  stream?: boolean;
  timezone?: string;
  todayString?: string;
  nowUserLocal?: string;
  clientNowISO?: string;
} {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid request body');
  }
  
  const { 
    message, 
    conversation_history = [], 
    attachments = [], 
    thread_id, 
    coach_mode = false, 
    stream = false,
    timezone,
    todayString,
    nowUserLocal,
    clientNowISO
  } = data;
  
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new Error('Message is required and must be a non-empty string');
  }
  
  if (message.length > 50000) {
    throw new Error('Message too long (max 50,000 characters)');
  }
  
  if (!Array.isArray(conversation_history)) {
    throw new Error('Conversation history must be an array');
  }
  
  if (!Array.isArray(attachments)) {
    throw new Error('Attachments must be an array');
  }
  
  if (attachments.length > 10) {
    throw new Error('Too many attachments (max 10)');
  }
  
  return { 
    message: message.trim(), 
    conversation_history, 
    attachments, 
    thread_id, 
    coach_mode: Boolean(coach_mode), 
    stream: Boolean(stream),
    timezone,
    todayString,
    nowUserLocal,
    clientNowISO
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const validatedInput = validateInput(await req.json());
    const { message, conversation_history, attachments, thread_id, coach_mode, stream, timezone, todayString, nowUserLocal, clientNowISO } = validatedInput;

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Get user from auth header with enhanced validation
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Invalid authorization header format');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error(`Authentication failed: ${authError?.message || 'Unknown error'}`);
    }

    console.log(`Processing request for user ${user.id} with ${attachments.length} attachments, stream: ${stream}`);

    // Resolve effective timezone and compute timezone-aware dates
    let effectiveTimezone = timezone;
    if (!effectiveTimezone) {
      // Fallback to user's saved timezone from profiles_secure
      try {
        const { data: profile } = await supabase
          .from('profiles_secure')
          .select('timezone')
          .eq('user_id', user.id)
          .single();
        effectiveTimezone = profile?.timezone || 'UTC';
      } catch (error) {
        console.warn('Could not fetch user timezone, using UTC:', error);
        effectiveTimezone = 'UTC';
      }
    }

    // Helper to compute dates in user's timezone
    const getDateInTimezone = (date?: Date): Date => {
      const targetDate = date || new Date();
      try {
        const timezonedString = new Intl.DateTimeFormat('en-CA', {
          timeZone: effectiveTimezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(targetDate);
        return new Date(timezonedString + 'T00:00:00.000Z');
      } catch (error) {
        console.warn('Invalid timezone, falling back to UTC:', error);
        return targetDate;
      }
    };

    // Compute timezone-aware current time if not provided by client
    const userToday = todayString || getDateInTimezone().toISOString().slice(0, 10);
    const userNowFormatted = nowUserLocal || new Intl.DateTimeFormat('en-CA', {
      timeZone: effectiveTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(new Date()).replace(',', '');

    console.log(`Timezone: ${effectiveTimezone}, User today: ${userToday}, User now: ${userNowFormatted}`);

    // Get user's financial context with enhanced error handling
    const fetchFinancialData = async () => {
      const [
        budgetResult,
        goalsResult,
        allTransactionsResult,
        accountsResult,
        recentTransactionsResult,
        aiGuidesResult
      ] = await Promise.allSettled([
        supabase.from('budget').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('goals').select('*').eq('user_id', user.id),
        supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(2000),
        supabase.from('accounts').select('*').eq('user_id', user.id),
        supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(20),
        supabase.from('ai_guides').select('*').eq('is_active', true)
      ]);

      const getData = (result: any) => result.status === 'fulfilled' ? result.value.data : null;

      return {
        budget: getData(budgetResult),
        goals: getData(goalsResult),
        allTransactions: getData(allTransactionsResult),
        accounts: getData(accountsResult),
        recentTransactions: getData(recentTransactionsResult),
        aiGuides: getData(aiGuidesResult)
      };
    };

    const { budget, goals, allTransactions, accounts, recentTransactions, aiGuides } = await retryWithBackoff(fetchFinancialData);

    // Build comprehensive financial context
    const financialContext = {
      budget: budget || null,
      goals: goals || [],
      recent_transactions: recentTransactions || [],
      accounts: accounts || [],
      all_transactions: allTransactions || []
    };

    // Advanced financial analysis for 24-month period using timezone-aware dates
    const nowInTimezone = getDateInTimezone();
    const oneMonthAgo = new Date(nowInTimezone.getFullYear(), nowInTimezone.getMonth() - 1, nowInTimezone.getDate());
    const threeMonthsAgo = new Date(nowInTimezone.getFullYear(), nowInTimezone.getMonth() - 3, nowInTimezone.getDate());
    const sixMonthsAgo = new Date(nowInTimezone.getFullYear(), nowInTimezone.getMonth() - 6, nowInTimezone.getDate());
    const oneYearAgo = new Date(nowInTimezone.getFullYear() - 1, nowInTimezone.getMonth(), nowInTimezone.getDate());
    const twoYearsAgo = new Date(nowInTimezone.getFullYear() - 2, nowInTimezone.getMonth(), nowInTimezone.getDate());
    
    // Filter transactions by time periods
    const lastMonthTransactions = allTransactions?.filter(t => new Date(t.date) >= oneMonthAgo) || [];
    const last3MonthsTransactions = allTransactions?.filter(t => new Date(t.date) >= threeMonthsAgo) || [];
    const last6MonthsTransactions = allTransactions?.filter(t => new Date(t.date) >= sixMonthsAgo) || [];
    const lastYearTransactions = allTransactions?.filter(t => new Date(t.date) >= oneYearAgo) || [];
    const last24MonthsTransactions = allTransactions?.filter(t => new Date(t.date) >= twoYearsAgo) || [];
    
    // Comprehensive income/expense analysis by period
    const calculatePeriodMetrics = (transactions: any[]) => {
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
      hasLongTermData: (allTransactions?.length || 0) > 50,
      
      // Trend indicators
      incomeGrowth: metrics.lastYear.income > 0 && metrics.last24Months.income > metrics.lastYear.income ? 
        (((metrics.last24Months.income - metrics.lastYear.income) / metrics.lastYear.income) * 100).toFixed(1) : 0,
      expenseGrowth: metrics.lastYear.expenses > 0 && metrics.last24Months.expenses > metrics.lastYear.expenses ? 
        (((metrics.last24Months.expenses - metrics.lastYear.expenses) / metrics.lastYear.expenses) * 100).toFixed(1) : 0
    };

    // Enhanced system prompt with Deep Think mode capability and timezone awareness
    let systemPrompt = `You are an advanced financial assistant powered by Gemini 2.5 Pro with Deep Think reasoning capabilities. You can analyze up to 24 months of transaction data to provide comprehensive insights, detailed reporting, and personalized money management advice. Think step-by-step through complex financial problems for the most accurate and helpful responses.

ENHANCED REASONING MODE: 
Use Deep Think approach for complex financial analysis - break down problems step-by-step, consider multiple perspectives, analyze long-term implications, and provide detailed reasoning for all recommendations.

FORMATTING RULES:
- Use plain text only, no markdown formatting
- Do not use asterisks (*) for emphasis or bold text
- Use CAPS for emphasis when needed
- Use clear, readable plain text formatting

TIMEZONE AWARENESS:
- User timezone: ${effectiveTimezone}
- User local now: ${userNowFormatted}
- User today: ${userToday}
- Treat "today", "this month", and due dates in this timezone
- Use the provided userToday and userNowFormatted for all date-based reasoning and calculations

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

You now have access to a comprehensive budgeting education guide. Use Deep Think reasoning to:
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

DEEP THINK ANALYSIS REQUIREMENTS:
- Break down complex financial problems into logical steps
- Consider multiple scenarios and their implications
- Analyze cause-and-effect relationships in spending patterns
- Evaluate short-term vs long-term financial impacts
- Provide detailed reasoning for all recommendations
- Consider psychological and behavioral factors in financial decisions

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
- Use Deep Think reasoning for complex financial questions
${coach_mode ? '- In coach mode: Focus on education, ask guiding questions, and provide step-by-step learning' : ''}

CRITICAL: With 24 months of data, provide sophisticated analysis including seasonal trends, year-over-year growth, spending pattern evolution, and data-driven budget recommendations. Always mention the time period being analyzed to show the depth of insights. Use Deep Think mode for complex problems - think through multiple steps and scenarios.`;

    // Process attachments for Gemini with enhanced error handling and observability
    const geminiParts = [];
    const processedAttachments = [];
    const processedNames = [];
    const skippedAttachments = [];
    const attachmentErrors = [];
    let hasPdf = false;
    
    // Check for PDF attachments to add credit report instruction
    if (attachments && attachments.length > 0) {
      hasPdf = attachments.some(att => att.type === 'application/pdf' || att.name.endsWith('.pdf'));
    }
    
    // Prepend credit report analysis instruction if PDF present
    let fullPrompt = message;
    if (hasPdf) {
      const creditInstruction = `First, extract and assess key drivers from the attached credit report: payment history, utilization (overall and by card), age of accounts, inquiries, derogatories, and credit mix. Then, provide a prioritized 30/60/90-day action plan to improve the score.`;
      fullPrompt = `${creditInstruction}\n\nUser query: ${message}`;
    }
    
    geminiParts.push({ text: fullPrompt });
    
    if (attachments && attachments.length > 0) {
      console.log(`Processing ${attachments.length} attachments`);
      
      for (const attachment of attachments) {
        try {
          // Skip empty or missing URLs
          if (!attachment.url || !attachment.url.trim()) {
            console.log(`Skipping attachment ${attachment.name}: empty URL`);
            skippedAttachments.push({ name: attachment.name, reason: 'Empty URL' });
            continue;
          }

          console.log(`Processing attachment: ${attachment.name}, type: ${attachment.type}, url: ${attachment.url}`);
          
          // Extract file path - prefer client-provided path, fallback to URL parsing
          let filePath = attachment.path || attachment.url;
          
          // If no direct path and it's a signed URL, extract the path
          if (!attachment.path) {
            if (attachment.url.includes('/storage/v1/object/sign/chat-uploads/')) {
              const match = attachment.url.match(/\/storage\/v1\/object\/sign\/chat-uploads\/([^?]+)/);
              if (match) {
                filePath = decodeURIComponent(match[1]);
              }
            } else if (attachment.url.includes('chat-uploads/')) {
              const urlParts = attachment.url.split('chat-uploads/');
              if (urlParts.length > 1) {
                filePath = urlParts[1].split('?')[0];
              }
            }
          }
          
          console.log(`Extracted file path: ${filePath}`);
          
          // Download file from Supabase Storage with retry
          const downloadFile = async () => {
            const { data: fileData, error: downloadError } = await supabase.storage
              .from('chat-uploads')
              .download(filePath);
              
            if (downloadError) {
              throw new Error(`Failed to download ${attachment.name}: ${downloadError.message}`);
            }
            
            return fileData;
          };

          const fileData = await retryWithBackoff(downloadFile);
          
          if (attachment.type.startsWith('image/')) {
            // Process images using robust base64 encoding
            const buffer = await fileData.arrayBuffer();
            const base64 = base64Encode(new Uint8Array(buffer));
            
            geminiParts.push({
              inlineData: {
                mimeType: attachment.type,
                data: base64
              }
            });
            processedAttachments.push(attachment);
            processedNames.push(attachment.name);
            console.log(`Added image to Gemini parts: ${attachment.name} (${buffer.byteLength} bytes)`);
            
          } else if (attachment.type === 'application/pdf' || attachment.name.endsWith('.pdf')) {
            // Process PDF files using robust base64 encoding
            const buffer = await fileData.arrayBuffer();
            const base64 = base64Encode(new Uint8Array(buffer));
            
            geminiParts.push({
              inlineData: {
                mimeType: 'application/pdf',
                data: base64
              }
            });
            processedAttachments.push(attachment);
            processedNames.push(attachment.name);
            console.log(`Added PDF to Gemini parts: ${attachment.name} (${buffer.byteLength} bytes)`);
            
          } else if (attachment.type.startsWith('text/') || 
                     attachment.type === 'application/json' || 
                     attachment.type === 'text/csv') {
            // Process text-based files
            const text = await fileData.text();
            const truncatedText = text.length > 2000 ? text.substring(0, 2000) + '...' : text;
            
            geminiParts.push({ 
              text: `\n\nFile: ${attachment.name}\nContent:\n${truncatedText}` 
            });
            processedAttachments.push(attachment);
            processedNames.push(attachment.name);
            console.log(`Added text file to Gemini parts: ${attachment.name} (${text.length} characters)`);
          } else {
            console.log(`Skipping unsupported file type: ${attachment.type} for ${attachment.name}`);
            skippedAttachments.push({ name: attachment.name, reason: 'Unsupported file type' });
          }
        } catch (error) {
          console.error(`Error processing attachment ${attachment.name}:`, error);
          attachmentErrors.push({ name: attachment.name, reason: 'Processing failed' });
          // Continue processing other attachments
        }
      }
    }

    // Build conversation history for Gemini
    const history = conversation_history.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.message || msg.content || '' }]
    }));

    // Enhanced Gemini API call with streaming support
    const callGeminiAPI = async () => {
      const apiUrl = stream 
        ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:streamGenerateContent?key=${geminiApiKey}`
        : `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiApiKey}`;

      const requestBody = {
        contents: [
          {
            role: 'user',
            parts: geminiParts
          }
        ],
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          temperature: 0.3, // Lower for more factual, detailed outputs
          topK: 40,
          topP: 0.8,
          maxOutputTokens: 8192, // Higher for longer responses
          candidateCount: 1,
          stopSequences: [],
          responseMimeType: "text/plain"
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      };

      console.log(`Making Gemini API call with streaming: ${stream}`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error response:', errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      return response;
    };

    const geminiResponse = await retryWithBackoff(callGeminiAPI);

    // Handle streaming vs non-streaming responses
    if (stream) {
      console.log('Setting up streaming response');
      
      // Create a transform stream for processing chunks
      const transformStream = new TransformStream({
        transform(chunk, controller) {
          const decoder = new TextDecoder();
          const text = decoder.decode(chunk);
          
          // Parse streaming response chunks
          const lines = text.split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                  const content = data.candidates[0].content.parts[0].text;
                  if (content) {
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`));
                  }
                }
              } catch (e) {
                console.error('Error parsing streaming chunk:', e);
              }
            }
          }
        }
      });

      return new Response(geminiResponse.body?.pipeThrough(transformStream), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    } else {
      // Handle non-streaming response
      const result = await geminiResponse.json();
      console.log('Gemini response received');

      if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
        throw new Error('Invalid response format from Gemini API');
      }

      const assistantMessage = result.candidates[0].content.parts[0].text;

      // Save conversation to database with enhanced error handling
      if (thread_id) {
        try {
          await retryWithBackoff(async () => {
            const { error: userMsgError } = await supabase
              .from('conversations')
              .insert({
                user_id: user.id,
                thread_id: thread_id,
                role: 'user',
                message: message,
                attachments: attachments
              });

            if (userMsgError) throw userMsgError;

            const { error: assistantMsgError } = await supabase
              .from('conversations')
              .insert({
                user_id: user.id,
                thread_id: thread_id,
                role: 'assistant',
                message: assistantMessage
              });

            if (assistantMsgError) throw assistantMsgError;
          });
          
          console.log('Conversation saved to database');
        } catch (error) {
          console.error('Error saving conversation:', error);
          // Don't fail the whole request if conversation saving fails
        }
      }

      return new Response(JSON.stringify({ 
        response: assistantMessage,
        model: 'gemini-2.5-pro',
        timestamp: new Date().toISOString(),
        savedToDb: thread_id ? true : false,
        debug: {
          processedAttachments: processedAttachments.length,
          processedNames: processedNames,
          skippedAttachments: skippedAttachments.length,
          attachmentErrors: attachmentErrors.length,
          effectiveTimezone: effectiveTimezone,
          userToday: userToday,
          userNowFormatted: userNowFormatted
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Error in gemini-chat function:', error);
    
    // Enhanced error responses
    let errorMessage = 'An unexpected error occurred';
    let statusCode = 500;
    
    if (error.message.includes('Authentication failed')) {
      errorMessage = 'Authentication failed. Please log in again.';
      statusCode = 401;
    } else if (error.message.includes('Invalid request body')) {
      errorMessage = 'Invalid request format. Please check your input.';
      statusCode = 400;
    } else if (error.message.includes('Message too long')) {
      errorMessage = 'Message is too long. Please shorten your message.';
      statusCode = 400;
    } else if (error.message.includes('Too many attachments')) {
      errorMessage = 'Too many attachments. Maximum 10 attachments allowed.';
      statusCode = 400;
    } else if (error.message.includes('Gemini API error')) {
      errorMessage = 'AI service temporarily unavailable. Please try again.';
      statusCode = 503;
    } else if (error.message.includes('API key not configured')) {
      errorMessage = 'AI service not properly configured.';
      statusCode = 500;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      timestamp: new Date().toISOString(),
      code: statusCode
    }), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});