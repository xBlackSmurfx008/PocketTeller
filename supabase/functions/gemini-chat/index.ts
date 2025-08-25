import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

import { Configuration, OpenAIApi } from "https://esm.sh/openai@3";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY')

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
  'Access-Control-Allow-Origin': 'https://dscndbpqvhvylukvcgpq.supabase.co',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
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
      clientNowISO
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
    
    if (!memory_extraction_mode) {
      // Retrieve user memories with message context for relevance scoring
      memories = await retrieveUserMemories(supabase, user.id, message);
      memoryContext = buildMemoryContext(memories);
      console.log(`Retrieved ${memories.length} user memories for context`);
    }

    let processedAttachments: { name: string; type: string; url: string; }[] = [];
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

          // Basic type check (enhance as needed)
          if (!attachment.type.startsWith('image/') && !attachment.type.startsWith('text/') && !attachment.type.startsWith('application/pdf')) {
            console.warn('Skipping attachment with unsupported type:', attachment);
            attachmentErrors++;
            continue;
          }

          processedAttachments.push({
            name: attachment.name,
            type: attachment.type,
            url: attachment.url
          });
        } catch (attachmentError) {
          console.error('Error processing attachment:', attachment, attachmentError);
          attachmentErrors++;
        }
      }

      console.log(`Processed ${processedAttachments.length} attachments, ${attachmentErrors} errors`);
    }

    // Construct the system prompt with memory context
    let systemPrompt = `You are a helpful AI financial assistant. You provide personalized advice on budgeting, saving, investing, and financial planning.

Current date/time context:
- User's timezone: ${timezone || 'Unknown'}
- Today's date: ${todayString || 'Unknown'}
- Current local time: ${nowUserLocal || 'Unknown'}
- Client timestamp: ${clientNowISO || 'Unknown'}

${memoryContext}`;

    if (processedAttachments.length > 0) {
      systemPrompt += `\n\nThe user has provided the following attachments. Use them to provide more accurate and relevant advice:\n`;
      processedAttachments.forEach(attachment => {
        systemPrompt += `- ${attachment.name} (${attachment.type}): ${attachment.url}\n`;
      });
    }

    if (coach_mode) {
      systemPrompt += `

COACHING MODE: You are in educational coaching mode. Focus on:
1. Teaching financial concepts step-by-step
2. Asking reflective questions to guide learning
3. Encouraging good financial habits
4. Providing evidence-based guidance
5. Suggesting relevant educational resources

Based on the conversation stage, provide 2-3 relevant coaching questions that help the user reflect and learn. Choose from categories like Assessment, Clarification, Exploration, Planning, etc.`;
    }

    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiApiKey}`, {
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
    if (!memory_extraction_mode && message && aiResponse) {
      try {
        const memoryResult = await extractAndUpsertMemories(
          supabase, 
          user.id, 
          message, 
          aiResponse, 
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

        // Store assistant message
        await supabase.from('conversations').insert({
          thread_id: thread_id,
          user_id: user.id,
          role: 'assistant',
          message: aiResponse
        });

        console.log('Conversation stored successfully');
      } catch (dbError) {
        console.error('Error storing conversation:', dbError);
      }
    }

    return new Response(JSON.stringify({
      response: aiResponse,
      model: 'gemini-1.5-pro',
      timestamp: new Date().toISOString(),
      savedToDb: !!thread_id && !memory_extraction_mode,
      coach_stage: coachStage,
      coach_questions: coachQuestions,
      debug: {
        processedAttachments: processedAttachments.length,
        processedNames: processedAttachments.map(a => a.name),
        skippedAttachments: (attachments?.length || 0) - processedAttachments.length,
        attachmentErrors: attachmentErrors,
        memoryUsedCount: memories.length,
        memoryUpsertedCount: memoryUpsertedCount
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in gemini-chat function:', error);
    return new Response(JSON.stringify({
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
