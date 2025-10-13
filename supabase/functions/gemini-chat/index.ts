import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

import { Configuration, OpenAIApi } from "https://esm.sh/openai@3";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const geminiApiKey = Deno.env.get('GEMINI_API_KEY')

const assessmentQuestions = [
  "What are your current financial goals?",
  "What is your biggest financial challenge right now?",
  "How would you describe your current financial situation?",
  "What are your biggest concerns about your finances?",
  "What are your priorities when it comes to managing your money?"
];

const clarificationQuestions = [
  "Can you tell me more about your income and expenses?",
  "What kind of debts do you have, and what are the interest rates?",
  "What are your assets, and how are they allocated?",
  "What are your insurance coverage details?",
  "What are your retirement plans, and how much have you saved so far?"
];

const explorationQuestions = [
  "What have you tried in the past to address your financial challenges?",
  "What worked well, and what didn't?",
  "What resources have you used to learn about personal finance?",
  "What are your beliefs about money and wealth?",
  "What are your biggest fears about your financial future?"
];

const planningQuestions = [
  "What steps can you take to improve your financial situation?",
  "What are your short-term and long-term financial goals?",
  "How can you create a budget that works for you?",
  "What are some strategies for reducing debt and increasing savings?",
  "How can you invest your money wisely to achieve your financial goals?"
];

const commitmentQuestions = [
  "What specific actions will you take in the next week to improve your finances?",
  "How will you hold yourself accountable for achieving your goals?",
  "What support do you need to stay on track?",
  "What obstacles might you encounter, and how will you overcome them?",
  "How will you reward yourself for making progress?"
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// SSRF protection: validate attachment URLs
function isValidAttachmentUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    
    // Only allow HTTPS URLs
    if (parsedUrl.protocol !== 'https:') {
      return false;
    }
    
    // Block private/internal IPs and local addresses
    const hostname = parsedUrl.hostname.toLowerCase();
    if (
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname.endsWith('.local') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.match(/^172\.(1[6-9]|2[0-9]|3[01])\./) ||
      hostname.startsWith('169.254.') || // Link-local
      hostname.startsWith('224.') || // Multicast
      hostname.includes('metadata') // Cloud metadata
    ) {
      return false;
    }
    
    // Only allow trusted domains for file uploads
    const allowedDomains = [
      'cdn.supabase.co',
      'supabase.co', 
      'storage.googleapis.com',
      'amazonaws.com',
      's3.amazonaws.com'
    ];
    
    const isDomainAllowed = allowedDomains.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );
    
    return isDomainAllowed;
  } catch {
    return false;
  }
}

// Rate limiting for AI endpoints
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string, maxRequests = 30, windowMs = 60000): boolean {
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

interface UserMemory {
  id: string;
  category: string;
  key?: string;
  value: {
    text: string;
    details?: any;
  };
  importance: number;
  confidence: number;
  occurrences: number;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  last_reinforced_at?: string;
}

interface MemoryCandidate {
  category: string;
  key?: string;
  text: string;
  importance: number;
  confidence: number;
  source: string;
}

function detectConversationStage(userMessage: string, conversationHistory: { role: string; content: string; }[]): string {
  // Combine the user's message and the conversation history into a single text
  const combinedText = userMessage + " " + conversationHistory.map(msg => msg.content).join(" ");

  // Check for keywords or phrases that indicate the conversation stage
  if (combinedText.match(/(financial goals|current financial situation|biggest financial challenge)/i)) {
    return "Assessment";
  } else if (combinedText.match(/(income and expenses|debts|assets|insurance|retirement plans)/i)) {
    return "Clarification";
  } else if (combinedText.match(/(tried in the past|worked well|resources used|beliefs about money|fears about financial future)/i)) {
    return "Exploration";
  } else if (combinedText.match(/(steps to improve|short-term and long-term goals|create a budget|strategies for reducing debt|invest your money wisely)/i)) {
    return "Planning";
  } else if (combinedText.match(/(specific actions|hold yourself accountable|support needed|obstacles|reward yourself)/i)) {
    return "Commitment";
  } else {
    return "General";
  }
}

function getRelevantQuestions(stage: string, userMessage: string): string[] {
  // Filter questions based on the conversation stage
  switch (stage) {
    case "Assessment":
      return assessmentQuestions.filter(q => !userMessage.includes(q));
    case "Clarification":
      return clarificationQuestions.filter(q => !userMessage.includes(q));
    case "Exploration":
      return explorationQuestions.filter(q => !userMessage.includes(q));
    case "Planning":
      return planningQuestions.filter(q => !userMessage.includes(q));
    case "Commitment":
      return commitmentQuestions.filter(q => !userMessage.includes(q));
    default:
      return [];
  }
}

// Memory configuration
const MEMORY_CONFIG = {
  MAX_TOTAL_MEMORIES: 100,
  MAX_PINNED: 30,
  MAX_RECENT: 120,
  MAX_PER_CATEGORY: 12,
  TOKEN_BUDGET: 3000 // Approximate token budget for memory context
};

// Calculate relevance score based on keyword overlap
function calculateRelevanceScore(memory: UserMemory, userMessage: string): number {
  const memoryText = memory.value.text.toLowerCase();
  const messageWords = userMessage.toLowerCase().split(/\s+/);
  
  let matches = 0;
  for (const word of messageWords) {
    if (word.length > 3 && memoryText.includes(word)) {
      matches++;
    }
  }
  
  return matches / Math.max(messageWords.length, 1);
}

// Enhanced memory retrieval function
async function retrieveUserMemories(
  supabase: any, 
  userId: string, 
  userMessage: string = '',
  maxMemories?: number
): Promise<UserMemory[]> {
  try {
    const effectiveMaxMemories = maxMemories || MEMORY_CONFIG.MAX_TOTAL_MEMORIES;
    
    // Get pinned memories
    const { data: pinnedMemories, error: pinnedError } = await supabase
      .from('user_memories')
      .select('*')
      .eq('user_id', userId)
      .eq('is_pinned', true)
      .eq('is_deleted', false)
      .order('importance', { ascending: false })
      .limit(MEMORY_CONFIG.MAX_PINNED);

    if (pinnedError) {
      console.error('Error fetching pinned memories:', pinnedError);
    }

    // Get recent non-pinned memories
    const { data: recentMemories, error: recentError } = await supabase
      .from('user_memories')
      .select('*')
      .eq('user_id', userId)
      .eq('is_pinned', false)
      .eq('is_deleted', false)
      .or('expires_at.is.null,expires_at.gt.now()')
      .order('updated_at', { ascending: false })
      .limit(MEMORY_CONFIG.MAX_RECENT);

    if (recentError) {
      console.error('Error fetching recent memories:', recentError);
    }

    // Combine and deduplicate
    const allMemories = [
      ...(pinnedMemories || []),
      ...(recentMemories || [])
    ];
    
    // Remove duplicates by id
    const uniqueMemories = allMemories.filter((memory, index, self) => 
      self.findIndex(m => m.id === memory.id) === index
    );

    // Apply relevance scoring if user message provided
    let scoredMemories = uniqueMemories;
    if (userMessage.trim()) {
      scoredMemories = uniqueMemories.map(memory => ({
        ...memory,
        relevanceScore: calculateRelevanceScore(memory, userMessage)
      }));
      
      // Sort by: pinned status first, then relevance + importance, then recency
      scoredMemories.sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) return b.is_pinned ? 1 : -1;
        
        const scoreA = (a.relevanceScore || 0) * 0.4 + a.importance * 0.6;
        const scoreB = (b.relevanceScore || 0) * 0.4 + b.importance * 0.6;
        
        if (Math.abs(scoreA - scoreB) > 0.1) return scoreB - scoreA;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
    } else {
      // Default sort: pinned first, then importance, then recency
      scoredMemories.sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) return b.is_pinned ? 1 : -1;
        if (Math.abs(a.importance - b.importance) > 0.5) return b.importance - a.importance;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      });
    }

    return scoredMemories.slice(0, effectiveMaxMemories);
  } catch (error) {
    console.error('Error retrieving user memories:', error);
    return [];
  }
}

// Memory extraction function
async function extractAndUpsertMemories(
  supabase: any, 
  userId: string, 
  userMessage: string, 
  assistantResponse: string,
  threadId?: string
): Promise<{ upsertedCount: number }> {
  try {
    // Ask Gemini to extract memory candidates
    const memoryExtractionPrompt = `
You are a memory extraction system. Analyze the following conversation exchange and extract important facts, preferences, goals, constraints, or habits that should be remembered about the user for future conversations.

USER MESSAGE: "${userMessage}"
ASSISTANT RESPONSE: "${assistantResponse}"

Extract memory candidates as JSON array. Each item should have:
- category: one of 'preference', 'goal', 'constraint', 'habit', 'profile', 'fact', 'note'
- key: optional unique identifier for deduplication (e.g., 'budgeting_style', 'monthly_income')
- text: clear description of what to remember
- importance: 1-5 (1=low, 5=critical)
- confidence: 0.0-1.0 (how confident you are this is accurate)
- source: 'ai_extracted' or 'user_declared'

Only extract meaningful, lasting information. Don't extract temporary states or one-off comments.

Return JSON array or empty array if nothing to remember:`;

    const { data: geminiData, error: geminiError } = await supabase.functions.invoke('gemini-chat', {
      body: {
        message: memoryExtractionPrompt,
        conversation_history: [],
        coach_mode: false,
        memory_extraction_mode: true
      }
    });

    if (geminiError) {
      console.error('Error in memory extraction call:', geminiError);
      return { upsertedCount: 0 };
    }

    let memoryCandidates: MemoryCandidate[] = [];
    try {
      // Try to parse JSON from the response
      const responseText = geminiData?.response || geminiData?.message || '';
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        memoryCandidates = JSON.parse(jsonMatch[0]);
      }
    } catch (parseError) {
      console.error('Error parsing memory extraction response:', parseError);
      return { upsertedCount: 0 };
    }

    let upsertedCount = 0;

    // Process each memory candidate
    for (const candidate of memoryCandidates) {
      try {
        if (!candidate.category || !candidate.text) continue;

        const memoryValue = {
          text: candidate.text,
          details: {}
        };

        if (candidate.key) {
          // Check if memory with same key exists
          const { data: existing } = await supabase
            .from('user_memories')
            .select('*')
            .eq('user_id', userId)
            .eq('category', candidate.category)
            .eq('key', candidate.key)
            .eq('is_deleted', false)
            .maybeSingle();

          if (existing) {
            // Update existing memory
            const { error: updateError } = await supabase
              .from('user_memories')
              .update({
                value: memoryValue,
                importance: Math.max(existing.importance, candidate.importance),
                confidence: Math.max(existing.confidence, candidate.confidence),
                occurrences: existing.occurrences + 1,
                last_reinforced_at: new Date().toISOString(),
                source: candidate.source,
                thread_id: threadId
              })
              .eq('id', existing.id);

            if (!updateError) {
              upsertedCount++;
            }
          } else {
            // Insert new memory
            const { error: insertError } = await supabase
              .from('user_memories')
              .insert({
                user_id: userId,
                category: candidate.category,
                key: candidate.key,
                value: memoryValue,
                importance: candidate.importance,
                confidence: candidate.confidence,
                source: candidate.source,
                thread_id: threadId
              });

            if (!insertError) {
              upsertedCount++;
            }
          }
        } else {
          // Insert new memory without key (no deduplication)
          const { error: insertError } = await supabase
            .from('user_memories')
            .insert({
              user_id: userId,
              category: candidate.category,
              value: memoryValue,
              importance: candidate.importance,
              confidence: candidate.confidence,
              source: candidate.source,
              thread_id: threadId
            });

          if (!insertError) {
            upsertedCount++;
          }
        }
      } catch (memoryError) {
        console.error('Error processing memory candidate:', memoryError);
      }
    }

    return { upsertedCount };
  } catch (error) {
    console.error('Error in memory extraction and upsert:', error);
    return { upsertedCount: 0 };
  }
}

// Build user data context from accounts, transactions, and goals
async function buildUserDataContext(supabase: any, userId: string): Promise<string> {
  try {
    let context = '\n\n=== USER DATA CONTEXT ===\n';
    
    // Get Plaid connection status and account data
    const { data: accounts } = await supabase
      .from('accounts')
      .select('id, name, type, balance, current_balance, available_balance, institution_name, plaid_account_id')
      .eq('user_id', userId)
      .order('balance', { ascending: false })
      .limit(5);
    
    if (accounts && accounts.length > 0) {
      const totalBalance = accounts.reduce((sum, acc) => sum + (acc.current_balance || acc.balance || 0), 0);
      const hasPlaidConnection = accounts.some(acc => acc.plaid_account_id);
      
      context += `\nACCOUNTS:\n`;
      context += `- Total Balance: $${totalBalance.toLocaleString()}\n`;
      context += `- Plaid Connected: ${hasPlaidConnection ? 'Yes' : 'No'}\n`;
      context += `- Top 5 Accounts:\n`;
      
      accounts.forEach(acc => {
        const balance = acc.current_balance || acc.balance || 0;
        context += `  • ${acc.name} (${acc.type}): $${balance.toLocaleString()}\n`;
      });
    } else {
      context += `\nACCOUNTS: No accounts connected\n`;
    }
    
    // Get recent transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('id, amount, category, date, description, merchant_name')
      .eq('user_id', userId)
      .eq('pending', false)
      .order('date', { ascending: false })
      .limit(50);
    
    if (transactions && transactions.length > 0) {
      // Calculate category totals
      const categoryTotals = transactions.reduce((acc, txn) => {
        acc[txn.category] = (acc[txn.category] || 0) + Math.abs(txn.amount);
        return acc;
      }, {} as Record<string, number>);
      
      const topCategories = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
      
      const totalSpending = transactions
        .filter(txn => txn.amount > 0)
        .reduce((sum, txn) => sum + txn.amount, 0);
      
      context += `\nRECENT TRANSACTIONS (Last 50):\n`;
      context += `- Total Spending: $${totalSpending.toLocaleString()}\n`;
      context += `- Top 5 Categories:\n`;
      
      topCategories.forEach(([category, amount]) => {
        context += `  • ${category}: $${amount.toLocaleString()}\n`;
      });
      
      context += `- Latest 10 Transactions:\n`;
      transactions.slice(0, 10).forEach(txn => {
        const merchant = txn.merchant_name || txn.description || 'Unknown';
        context += `  • ${txn.date}: ${merchant} - $${Math.abs(txn.amount)} (${txn.category})\n`;
      });
    } else {
      context += `\nRECENT TRANSACTIONS: No transactions found\n`;
    }
    
    // Get financial goals
    const { data: goals } = await supabase
      .from('goals')
      .select('id, goal_name, target_amount, current_amount, deadline')
      .eq('user_id', userId)
      .order('target_amount', { ascending: false })
      .limit(5);
    
    if (goals && goals.length > 0) {
      context += `\nFINANCIAL GOALS:\n`;
      goals.forEach(goal => {
        const progress = goal.target_amount > 0 ? Math.round((goal.current_amount / goal.target_amount) * 100) : 0;
        const deadline = goal.deadline ? new Date(goal.deadline).toLocaleDateString() : 'No deadline';
        context += `  • ${goal.goal_name}: $${goal.current_amount.toLocaleString()} / $${goal.target_amount.toLocaleString()} (${progress}%) - Due: ${deadline}\n`;
      });
    } else {
      context += `\nFINANCIAL GOALS: No goals set\n`;
    }
    
    context += '\nUse this financial data to provide personalized advice based on the user\'s actual financial situation.\n';
    
    return context;
  } catch (error) {
    console.error('Error building user data context:', error);
    return '\n\n=== USER DATA CONTEXT ===\nError: Could not retrieve user financial data\n';
  }
}

// Enhanced memory context builder with token budget management
function buildMemoryContext(memories: UserMemory[]): string {
  if (memories.length === 0) {
    return '';
  }

  const memoryByCategory = memories.reduce((acc, memory) => {
    if (!acc[memory.category]) {
      acc[memory.category] = [];
    }
    acc[memory.category].push(memory);
    return acc;
  }, {} as Record<string, UserMemory[]>);

  let context = '\n\n=== USER MEMORY SUMMARY ===\n';
  let currentTokens = 0;
  const maxTokens = MEMORY_CONFIG.TOKEN_BUDGET;
  
  // Sort categories by importance (pinned items first, then by max importance in category)
  const sortedCategories = Object.entries(memoryByCategory).sort(([, a], [, b]) => {
    const aPinned = a.some(m => m.is_pinned);
    const bPinned = b.some(m => m.is_pinned);
    if (aPinned !== bPinned) return bPinned ? 1 : -1;
    
    const aMaxImportance = Math.max(...a.map(m => m.importance));
    const bMaxImportance = Math.max(...b.map(m => m.importance));
    return bMaxImportance - aMaxImportance;
  });

  for (const [category, categoryMemories] of sortedCategories) {
    const categoryHeader = `\n${category.toUpperCase()}:\n`;
    const categoryHeaderTokens = Math.ceil(categoryHeader.length / 4); // Rough token estimate
    
    if (currentTokens + categoryHeaderTokens > maxTokens) break;
    
    context += categoryHeader;
    currentTokens += categoryHeaderTokens;
    
    const sortedMemories = categoryMemories
      .sort((a, b) => {
        // Pinned first, then by relevance score if available, then importance, then recency
        if (a.is_pinned !== b.is_pinned) return b.is_pinned ? 1 : -1;
        
        const aScore = (a as any).relevanceScore || 0;
        const bScore = (b as any).relevanceScore || 0;
        if (Math.abs(aScore - bScore) > 0.1) return bScore - aScore;
        
        if (Math.abs(a.importance - b.importance) > 0.5) return b.importance - a.importance;
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      })
      .slice(0, MEMORY_CONFIG.MAX_PER_CATEGORY);

    let categoryCount = 0;
    for (const memory of sortedMemories) {
      const pinned = memory.is_pinned ? ' [PINNED]' : '';
      const confidence = memory.confidence < 0.8 ? ` (${Math.round(memory.confidence * 100)}% confident)` : '';
      const memoryLine = `• ${memory.value.text}${pinned}${confidence}\n`;
      const memoryTokens = Math.ceil(memoryLine.length / 4);
      
      if (currentTokens + memoryTokens > maxTokens) break;
      
      context += memoryLine;
      currentTokens += memoryTokens;
      categoryCount++;
    }
    
    // If we couldn't fit any memories from this category, remove the header
    if (categoryCount === 0) {
      context = context.slice(0, -categoryHeader.length);
      currentTokens -= categoryHeaderTokens;
    }
    
    if (currentTokens >= maxTokens * 0.9) break; // Leave some buffer
  }

  context += '\nUse this context to provide personalized, relevant responses. Reference memories naturally when appropriate.\n';
  
  return context;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: req.headers.get('Authorization') ?? ''
          }
        }
      }
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Verify the JWT token
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Invalid or expired token');
    }

    // Check rate limit
    if (!checkRateLimit(user.id)) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded. Please try again later.',
        timestamp: new Date().toISOString()
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { 
      message, 
      conversation_history, 
      attachments, 
      thread_id, 
      coach_mode,
      memory_extraction_mode = false,
      timezone,
      todayString,
      nowUserLocal,
      clientNowISO,
      include_user_data = true
    } = await req.json();

    console.log('Gemini chat request received:', { 
      userId: user.id, 
      messageLength: message?.length, 
      hasAttachments: !!attachments?.length,
      coachMode: coach_mode,
      memoryExtractionMode: memory_extraction_mode
    });

    // Skip memory operations for memory extraction calls to avoid recursion
    let memories: UserMemory[] = [];
    let memoryContext = '';
    let userDataContext = '';
    
    if (!memory_extraction_mode) {
      // Retrieve user memories with message context for relevance scoring
      memories = await retrieveUserMemories(supabase, user.id, message);
      memoryContext = buildMemoryContext(memories);
      console.log(`Retrieved ${memories.length} user memories for context`);
      
      // Gather user data if requested
      if (include_user_data) {
        userDataContext = await buildUserDataContext(supabase, user.id);
        console.log('Built user data context');
      }
    }

    let processedAttachments: { name: string; type: string; url: string; content?: string; }[] = [];
    let attachmentErrors = 0;

    if (attachments && attachments.length > 0) {
      console.log(`Processing ${attachments.length} attachments`);

      for (const attachment of attachments) {
        try {
          // Validate attachment properties
          if (!attachment.name || !attachment.type || !attachment.url) {
            console.warn('Skipping invalid attachment:', attachment);
            attachmentErrors++;
            continue;
          }

          // Enhanced type support
          const isTextFile = attachment.type.startsWith('text/') || 
                           attachment.type === 'application/json' || 
                           attachment.type === 'text/csv';
          const isPdf = attachment.type === 'application/pdf';
          const isImage = attachment.type.startsWith('image/');

          if (!isTextFile && !isPdf && !isImage) {
            console.warn('Skipping attachment with unsupported type:', attachment);
            attachmentErrors++;
            continue;
          }

          let attachmentInfo = {
            name: attachment.name,
            type: attachment.type,
            url: attachment.url
          };

          // Validate URL to prevent SSRF attacks
          if (!isValidAttachmentUrl(attachment.url)) {
            console.warn('Skipping attachment with invalid URL:', attachment.url);
            attachmentErrors++;
            continue;
          }

          // Try to fetch and extract text content for better context
          if (isTextFile || isPdf) {
            try {
              const response = await fetch(attachment.url, {
                headers: {
                  'User-Agent': 'FinanceApp/1.0'
                }
              });
              if (response.ok) {
                if (isTextFile) {
                  const text = await response.text();
                  // Limit text content to prevent token overflow
                  const excerpt = text.length > 3000 ? text.substring(0, 3000) + '...' : text;
                  attachmentInfo.content = excerpt;
                  console.log(`Extracted ${excerpt.length} chars from ${attachment.name}`);
                } else if (isPdf) {
                  // For PDFs, just note the filename and size for now
                  const size = response.headers.get('content-length');
                  attachmentInfo.content = `PDF document (${size ? `${Math.round(parseInt(size) / 1024)}KB` : 'size unknown'}) - Filename: ${attachment.name}`;
                  console.log(`PDF processed: ${attachment.name}`);
                }
              }
            } catch (fetchError) {
              console.warn(`Failed to fetch content for ${attachment.name}:`, fetchError);
              // Continue with just the attachment info
            }
          }

          processedAttachments.push(attachmentInfo);
        } catch (attachmentError) {
          console.error('Error processing attachment:', attachment, attachmentError);
          attachmentErrors++;
        }
      }

      console.log(`Processed ${processedAttachments.length} attachments, ${attachmentErrors} errors`);
    }

    // Construct the comprehensive financial coach system prompt
    let systemPrompt = `You are PocketTeller's AI Financial Coach - a knowledgeable, supportive, and professional financial advisor assistant designed to help users achieve financial wellness and make informed money decisions.

# YOUR ROLE & EXPERTISE

You are a certified financial coach with expertise in:
- **Personal Finance Management**: Budgeting, expense tracking, cash flow optimization
- **Debt Management**: Strategies for paying down debt, consolidation, credit improvement
- **Savings & Emergency Funds**: Building financial security and safety nets
- **Investment Basics**: Understanding investment vehicles, risk tolerance, diversification
- **Retirement Planning**: 401(k)s, IRAs, retirement savings strategies
- **Financial Goal Setting**: SMART goals, milestone tracking, accountability
- **Tax-Aware Planning**: Basic tax optimization strategies and considerations
- **Financial Literacy**: Teaching core concepts in accessible language
- **Behavioral Finance**: Understanding money psychology and habits

# YOUR RESPONSIBILITIES

1. **Provide Financial Education**: Explain concepts clearly, use examples, and ensure understanding
2. **Offer Actionable Advice**: Give specific, practical steps users can take
3. **Analyze User Data**: Reference their transactions, budgets, and goals when available
4. **Maintain Context**: Remember previous conversations and user preferences
5. **Encourage Good Habits**: Promote healthy financial behaviors and celebrate progress
6. **Stay Focused**: Keep conversations on financial topics - redirect off-topic queries politely
7. **Be Supportive**: Show empathy, avoid judgment, and maintain a positive coaching tone

# IMPORTANT GUIDELINES

✅ **DO:**
- Answer questions about budgeting, saving, investing, debt, and financial planning
- Provide specific strategies and step-by-step guidance
- Use real numbers and calculations when analyzing user's situation
- Reference financial resources, tools, and educational content
- Explain financial terms and concepts in simple language
- Celebrate financial wins and progress
- Ask clarifying questions to better understand the user's situation
- Provide multiple options when possible
- Consider the user's specific circumstances and constraints

❌ **DON'T:**
- Give specific stock picks or investment guarantees
- Provide tax filing services or act as a CPA
- Make decisions for the user - empower them to decide
- Discuss non-financial topics (politely redirect)
- Make promises about future returns or outcomes
- Recommend illegal or unethical financial practices
- Share personal opinions on politics or social issues
- Pressure users into financial decisions

# CONVERSATION STYLE

- **Warm & Professional**: Be friendly but maintain credibility
- **Clear & Concise**: Avoid jargon; explain when necessary
- **Action-Oriented**: Focus on what users can do next
- **Data-Driven**: Use numbers, statistics, and user's actual data
- **Encouraging**: Motivate users toward their financial goals
- **Honest**: Acknowledge limitations and when professional advice is needed

# LEGAL DISCLAIMER

You are an AI financial coach providing educational information and general guidance. You are NOT:
- A licensed financial advisor, broker, or investment advisor
- A certified public accountant (CPA) or tax professional  
- A licensed attorney or legal advisor

For complex situations involving significant assets, tax implications, legal matters, or specialized investment advice, recommend users consult with licensed professionals.

# CURRENT CONTEXT

**Date/Time Information:**
- User's timezone: ${timezone || 'Unknown'}
- Today's date: ${todayString || 'Unknown'}
- Current local time: ${nowUserLocal || 'Unknown'}
- Client timestamp: ${clientNowISO || 'Unknown'}

${memoryContext}${userDataContext}

# OFF-TOPIC HANDLING & STRICT BOUNDARIES

**CRITICAL: You must ONLY respond to financial-related questions. This is not negotiable.**

If users ask about non-financial topics, you MUST:

1. **First Request (Friendly Denial):**
"I'm specifically designed ONLY for financial questions and coaching. I cannot help with [topic]. I can only assist with budgeting, saving, investing, debt management, financial planning, and related money topics. What financial question can I help you with?"

2. **If User Insists or Pushes Back:**
"I understand you'd like help with that, but I'm programmed exclusively for financial coaching and cannot assist with non-financial topics under any circumstances. This limitation is for your protection and mine. 

🚨 **IMPORTANT**: Persistent requests for off-topic assistance have been logged for review by our team.

I'm here to help with your financial wellness. What money-related challenge can I assist you with today?"

**LOGGING REQUIREMENT**: If a user makes 2+ requests for non-financial topics in the same conversation, you MUST include this exact phrase in your response: "[REPORT_INCIDENT]" (the system will automatically log this for review).

**Examples of OFF-TOPIC (Always Deny):**
- General life advice
- Health/medical advice
- Legal advice (unless directly financial)
- Relationship advice (unless about money)
- Entertainment recommendations
- Sports, weather, news
- Homework help (unless financial calculations)
- Technical support for non-finance apps
- Political opinions
- Religious guidance

**Examples of ON-TOPIC (Always Help):**
- Any question about money, budgets, expenses
- Saving strategies and goals
- Investment basics and concepts
- Debt management and payoff
- Financial planning and decision-making
- Understanding financial products
- Tax-aware financial strategies
- Retirement planning
- Financial stress and money psychology

**Remember**: Even if a user claims their request is "related to finance" when it clearly isn't, you must still deny it. Stay firm on boundaries.

# RESOURCE RECOMMENDATIONS

When appropriate, suggest these types of resources:
- Educational articles about financial concepts
- Budgeting tools and calculators
- Debt payoff strategies and calculators
- Investment education resources
- Financial literacy books and podcasts
- Professional services (CFP, CPA) for complex needs`;

    if (processedAttachments.length > 0) {
      systemPrompt += `\n\nThe user has provided the following attachments. Use them to provide more accurate and relevant advice:\n`;
      processedAttachments.forEach(attachment => {
        systemPrompt += `- ${attachment.name} (${attachment.type})\n`;
        if (attachment.content) {
          systemPrompt += `  Content excerpt: ${attachment.content}\n`;
        } else {
          systemPrompt += `  URL: ${attachment.url}\n`;
        }
      });
    }

    if (coach_mode) {
      systemPrompt += `

# 🎓 ENHANCED COACHING MODE ACTIVATED

You are now in **intensive financial coaching mode**. This means you should:

## Teaching Methodology:
1. **Socratic Method**: Ask thoughtful questions that lead users to discover insights themselves
2. **Step-by-Step Breakdown**: Break complex financial topics into digestible chunks
3. **Teach by Example**: Use specific, relatable scenarios and calculations
4. **Check Understanding**: Pause to ensure concepts are clear before moving forward
5. **Build on Foundations**: Connect new concepts to previously learned material

## Financial Coaching Framework:
- **Assess**: Understand the user's current financial situation and knowledge level
- **Clarify**: Define goals and identify obstacles clearly
- **Explore**: Discuss options, strategies, and potential outcomes
- **Plan**: Create concrete, actionable steps with timelines
- **Commit**: Help user commit to specific actions and accountability
- **Review**: Track progress and adjust strategies as needed

## Your Coaching Questions Should:
- Be open-ended to encourage deeper thinking
- Help users identify their own barriers and solutions
- Connect emotions and behaviors to financial outcomes
- Encourage goal-setting and accountability
- Build financial confidence and capability

## Example Coaching Questions by Stage:

**Assessment Stage:**
- "What does financial success look like for you in 5 years?"
- "What's your biggest financial challenge right now, and why do you think that is?"
- "How do you typically feel about your spending decisions?"

**Clarification Stage:**
- "Can you walk me through your typical monthly expenses?"
- "What would need to happen for you to feel financially secure?"
- "Which financial goal, if achieved, would have the biggest impact on your life?"

**Exploration Stage:**
- "What strategies have you tried in the past? What worked and what didn't?"
- "If money wasn't a concern, how would you want your financial life to look?"
- "What resources or knowledge do you think would help you most right now?"

**Planning Stage:**
- "What's one specific action you could take this week to move toward that goal?"
- "What obstacles might come up, and how can you prepare for them?"
- "How will you track your progress on this goal?"

**Commitment Stage:**
- "On a scale of 1-10, how confident are you that you can take this action?"
- "What support or accountability would help you succeed?"
- "When exactly will you take this first step?"

Provide 2-3 relevant coaching questions that help the user reflect, learn, and take action.`;
    }

    // Call Gemini API (using gemini-2.5-flash for better performance and availability)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: systemPrompt + '\n\nUser: ' + message }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      throw new Error('No response from Gemini API');
    }

    // Check for incident reporting marker
    const hasIncidentReport = aiResponse.includes('[REPORT_INCIDENT]');
    if (hasIncidentReport) {
      console.log('🚨 Off-topic incident detected, logging for review');
      
      // Log the incident to database for review
      try {
        await supabase
          .from('ai_incident_reports')
          .insert({
            user_id: user.id,
            thread_id: thread_id || null,
            incident_type: 'off_topic_persistent',
            user_message: message,
            ai_response: aiResponse.replace('[REPORT_INCIDENT]', ''),
            context: {
              conversation_history: conversation_history?.slice(-5) || [], // Last 5 messages
              timezone: timezone,
              timestamp: new Date().toISOString()
            },
            severity: 'medium',
            reviewed: false
          });
        
        console.log('✅ Incident report logged successfully');
      } catch (reportError) {
        console.error('❌ Failed to log incident report:', reportError);
        // Don't fail the request, just log the error
      }
    }

    // Remove the marker from the response before sending to user
    const cleanedResponse = aiResponse.replace('[REPORT_INCIDENT]', '').trim();

    let coachStage = '';
    let coachQuestions: string[] = [];
    
    if (coach_mode) {
      const stage = detectConversationStage(message, conversation_history);
      coachStage = stage;
      coachQuestions = getRelevantQuestions(stage, message);
      console.log(`Coach mode: detected stage "${stage}", providing ${coachQuestions.length} questions`);
    }

    // Extract and upsert memories (background operation)
    let memoryUpsertedCount = 0;
    if (!memory_extraction_mode && message && cleanedResponse) {
      try {
        const memoryResult = await extractAndUpsertMemories(
          supabase, 
          user.id, 
          message, 
          cleanedResponse, 
          thread_id
        );
        memoryUpsertedCount = memoryResult.upsertedCount;
        console.log(`Memory extraction: upserted ${memoryUpsertedCount} memories`);
      } catch (memoryError) {
        console.error('Memory extraction failed (non-blocking):', memoryError);
      }
    }

    // Store conversation in database if thread_id is provided
    if (thread_id && !memory_extraction_mode) {
      try {
        // Store user message
        await supabase.from('conversations').insert({
          thread_id: thread_id,
          user_id: user.id,
          role: 'user',
          message: message,
          attachments: processedAttachments.length > 0 ? processedAttachments : null
        });

        // Store assistant message (cleaned, without marker)
        await supabase.from('conversations').insert({
          thread_id: thread_id,
          user_id: user.id,
          role: 'assistant',
          message: cleanedResponse
        });

        console.log('Conversation stored successfully');
      } catch (dbError) {
        console.error('Error storing conversation:', dbError);
      }
    }

    return new Response(JSON.stringify({
      response: cleanedResponse,
      model: 'gemini-2.5-flash',
      timestamp: new Date().toISOString(),
      savedToDb: !!thread_id && !memory_extraction_mode,
      coach_stage: coachStage,
      coach_questions: coachQuestions,
      incidentReported: hasIncidentReport,
      debug: {
        processedAttachments: processedAttachments.length,
        processedNames: processedAttachments.map(a => a.name),
        skippedAttachments: (attachments?.length || 0) - processedAttachments.length,
        attachmentErrors: attachmentErrors,
        memoryUsedCount: memories.length,
        memoryUpsertedCount: memoryUpsertedCount,
        userDataIncluded: !!userDataContext
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in gemini-chat function:', error);
    
    // Sanitize error message to prevent stack trace leakage
    let sanitizedError = 'Internal server error';
    if (error.message?.includes('Rate limit') || error.message?.includes('Invalid or expired token')) {
      sanitizedError = error.message;
    } else if (error.message?.includes('Gemini API error')) {
      sanitizedError = 'AI service temporarily unavailable';
    }
    
    return new Response(JSON.stringify({
      error: sanitizedError,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
