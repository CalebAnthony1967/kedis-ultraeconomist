/**
 * ============================================================================
 * KEDIS UltraEconomist — Hugging Face LLM + RAG Service
 * ============================================================================
 * Sovereign Retrieval-Augmented Generation pipeline:
 *   1. Retrieve relevant indicators from Supabase (sovereign data pool)
 *   2. Build structured context from matching records
 *   3. Call Hugging Face model with context + user query
 *   4. Parse SPI citations and probability scores from response
 *
 * Uses free Hugging Face Inference API (OpenAI-compatible router).
 * ============================================================================
 */

import { supabase } from './supabaseClient';
import { supabaseAuth } from './supabaseAuth';

const HF_TOKEN = import.meta.env.VITE_HF_TOKEN;
const HF_MODEL = 'mistralai/Mistral-7B-Instruct-v0.3';
const HF_API_URL = 'https://router.huggingface.co/v1/chat/completions';

// Fallback models if primary is unavailable
const FALLBACK_MODELS = [
  'HuggingFaceH4/zephyr-7b-beta',
  'meta-llama/Meta-Llama-3-8B-Instruct',
];

// ---------------------------------------------------------------------------
// Keyword Extraction
// ---------------------------------------------------------------------------

const STOP_WORDS = new Set([
  'the', 'is', 'a', 'an', 'what', 'how', 'does', 'do', 'are', 'in', 'of', 'to',
  'and', 'or', 'for', 'on', 'at', 'by', 'with', 'from', 'about', 'kenya',
  'kenyan', 'please', 'can', 'you', 'tell', 'me', 'give', 'show', 'was',
  'were', 'been', 'have', 'has', 'had', 'this', 'that', 'these', 'those',
  'it', 'its', 'be', 'as', 'not', 'no', 'but', 'if', 'then', 'than', 'so',
  'up', 'out', 'we', 'our', 'your', 'their', 'they', 'he', 'she', 'his',
  'her', 'which', 'who', 'whom', 'whose', 'when', 'where', 'why', 'will',
  'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can',
]);

function extractKeywords(query) {
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))
    .slice(0, 12);
}

// ---------------------------------------------------------------------------
// RAG: Retrieve relevant indicators from sovereign data pool
// ---------------------------------------------------------------------------

/**
 * Retrieve indicators matching the query from Supabase.
 * @param {string} query - User's natural language question
 * @param {object} datasetFilter - { type: 'all' | 'source' | 'job', value: string }
 * @param {number} limit - Max records to retrieve (default 25)
 */
export async function retrieveContext(query, datasetFilter = { type: 'all' }, limit = 25) {
  const keywords = extractKeywords(query);

  let supabaseQuery = supabase
    .from('indicators')
    .select('indicator_id, name, pillar, sector, sub_sector, department, location_code, year, value, unit, source_mcda, link_to_sdg, spi, is_verified')
    .limit(limit);

  // Apply dataset filter
  if (datasetFilter.type === 'source' && datasetFilter.value) {
    supabaseQuery = supabaseQuery.eq('source_mcda', datasetFilter.value);
  } else if (datasetFilter.type === 'job' && datasetFilter.value) {
    // Job filter: match by source_mcda and temporal_year from the ingestion job
    supabaseQuery = supabaseQuery.eq('source_mcda', datasetFilter.value.source_mcda);
    if (datasetFilter.value.temporal_year) {
      supabaseQuery = supabaseQuery.eq('year', datasetFilter.value.temporal_year);
    }
  } else if (datasetFilter.type === 'sector' && datasetFilter.value) {
    supabaseQuery = supabaseQuery.eq('sector', datasetFilter.value);
  }

  // Text search across multiple fields using OR + ilike
  if (keywords.length > 0) {
    const orConditions = keywords
      .flatMap(k => [
        `name.ilike.%${k}%`,
        `sector.ilike.%${k}%`,
        `sub_sector.ilike.%${k}%`,
        `search_text.ilike.%${k}%`,
      ])
      .join(',');
    supabaseQuery = supabaseQuery.or(orConditions);
  }

  // Order by year descending for most recent data first
  supabaseQuery = supabaseQuery.order('year', { ascending: false, nullsFirst: false });

  const { data, error } = await supabaseQuery;

  if (error) {
    console.warn('RAG retrieval error:', error);
    return [];
  }

  return data || [];
}

// ---------------------------------------------------------------------------
// Context Formatting
// ---------------------------------------------------------------------------

export function formatContext(indicators) {
  if (!indicators || indicators.length === 0) {
    return 'No specific indicator data was found in the sovereign data pool for this query.';
  }

  const lines = indicators.map((ind, i) => {
    const parts = [
      `[${i + 1}] ${ind.name || 'Unknown'}`,
      ind.spi ? `SPI: ${ind.spi}` : null,
      `Pillar: ${ind.pillar || 'N/A'}`,
      `Sector: ${ind.sector || 'N/A'}`,
      ind.sub_sector ? `Sub-sector: ${ind.sub_sector}` : null,
      ind.department ? `Dept: ${ind.department}` : null,
      ind.location_code ? `Location: ${ind.location_code}` : null,
      `Year: ${ind.year || 'N/A'}`,
      `Value: ${ind.value} ${ind.unit || ''}`.trim(),
      `Source: ${ind.source_mcda || 'N/A'}`,
      ind.link_to_sdg ? `SDG: ${ind.link_to_sdg}` : null,
      ind.is_verified ? 'Verified: Yes' : 'Verified: No',
    ].filter(Boolean);
    return parts.join(' | ');
  });

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Hugging Face LLM Call
// ---------------------------------------------------------------------------

async function callHFModel(model, systemPrompt, userPrompt) {
  const response = await fetch(HF_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HF_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 1500,
      top_p: 0.9,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`HF API ${response.status}: ${errText.substring(0, 200)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// ---------------------------------------------------------------------------
// Response Parsing
// ---------------------------------------------------------------------------

function parseResponse(content, indicators) {
  // Extract SPI citations mentioned in the response
  const spiPattern = /\[SPI:\s*([^\]]+)\]/gi;
  const matches = [...content.matchAll(spiPattern)];
  const citedSPIs = matches.map(m => m[1].trim());

  // Also include SPIs from the retrieved indicators that appear in the response
  const indicatorSPIs = indicators
    .filter(ind => ind.spi && content.includes(ind.spi))
    .map(ind => ind.spi);

  const allSPIs = [...new Set([...citedSPIs, ...indicatorSPIs])];

  // Extract probability score
  const probPattern = /(?:PROBABILITY|probability|Probability)(?:\s*of\s*(?:achievement|success))?\s*[:=]?\s*(\d{1,3})\s*%/i;
  const probMatch = content.match(probPattern);
  let probabilityScore = null;
  if (probMatch) {
    probabilityScore = parseInt(probMatch[1], 10);
    if (probabilityScore > 100) probabilityScore = 100;
  }

  // Clean up the content - remove the PROBABILITY line from display
  let cleanContent = content.replace(/\n*PROBABILITY[^:]*[:=]?\s*\d{1,3}\s*%.*/gi, '').trim();

  return {
    answer: cleanContent,
    spi_citations: allSPIs,
    probability_score: probabilityScore,
    context_count: indicators.length,
  };
}

// ---------------------------------------------------------------------------
// Main RAG Pipeline
// ---------------------------------------------------------------------------

/**
 * Run the full RAG pipeline: retrieve → augment → generate
 * @param {string} query - User's question
 * @param {object} datasetFilter - Filter for which data to search
 * @param {string} lang - 'en' or 'sw'
 * @param {array} conversationHistory - Previous messages for context
 */
export async function runRAG(query, datasetFilter, lang = 'en', conversationHistory = []) {
  if (!HF_TOKEN) {
    throw new Error('Hugging Face token not configured. Set VITE_HF_TOKEN in your environment.');
  }

  // 1. Retrieve relevant indicators
  const indicators = await retrieveContext(query, datasetFilter, 25);
  const contextText = formatContext(indicators);

  // 2. Build system prompt
  const langInstruction = lang === 'sw' ? 'Swahili' : 'English';
  const systemPrompt = `You are AlphaEconomist, Kenya's sovereign economic intelligence AI assistant, built on the KEDIS UltraEconomist platform.

Your role is to provide evidence-based policy advice using ONLY the verified data provided in the context below. You serve KIPPRA economists, Treasury analysts, and government policy makers.

CORE RULES:
1. Use ONLY the data provided in the context. Do not hallucinate or fabricate data points.
2. Cite every key data point using its SPI identifier in the format [SPI:XXXX-XXXX-XXXX].
3. If asked about policy targets, provide a "Probability of Achievement" score (0-100%) on a new line as: PROBABILITY: XX%
4. Structure your response with clear headings, bullet points, and data tables where appropriate.
5. If the context is insufficient, clearly state what data is missing and suggest which MCDA source should be queried.
6. Respond in ${langInstruction}.

SOVEREIGN DATA CONTEXT (Retrieved from KEDIS indicators pool):
${contextText}

Remember: You are advising on Kenya's economic policy. Be precise, analytical, and actionable. Every claim must be traceable to an SPI.`;

  // 3. Build user prompt with conversation history
  let userPrompt = query;
  if (conversationHistory.length > 0) {
    const historyText = conversationHistory
      .slice(-4) // Last 4 messages for context window
      .map(m => `${m.role === 'user' ? 'User' : 'AlphaEconomist'}: ${m.content}`)
      .join('\n\n');
    userPrompt = `Previous conversation:\n${historyText}\n\nCurrent question: ${query}`;
  }

  // 4. Call Hugging Face model (with fallback)
  let rawResponse;
  try {
    rawResponse = await callHFModel(HF_MODEL, systemPrompt, userPrompt);
  } catch (primaryError) {
    console.warn('Primary HF model failed, trying fallback:', primaryError.message);
    let lastError = primaryError;
    for (const fallbackModel of FALLBACK_MODELS) {
      try {
        rawResponse = await callHFModel(fallbackModel, systemPrompt, userPrompt);
        break;
      } catch (e) {
        lastError = e;
      }
    }
    if (!rawResponse) {
      throw new Error(`All LLM models failed. Last error: ${lastError.message}`);
    }
  }

  // 5. Parse response
  const parsed = parseResponse(rawResponse, indicators);

  return {
    ...parsed,
    raw_response: rawResponse,
    retrieved_indicators: indicators,
  };
}

// ---------------------------------------------------------------------------
// Conversation Persistence
// ---------------------------------------------------------------------------

export async function saveConversation(conversationId, messages, title, lang, sector) {
  const user = await supabaseAuth.me();
  if (!user) throw new Error('Not authenticated');

  if (conversationId) {
    // Update existing conversation
    const { data, error } = await supabase
      .from('copilot_conversations')
      .update({
        messages,
        title,
        sector,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    // Create new conversation
    const { data, error } = await supabase
      .from('copilot_conversations')
      .insert({
        title,
        messages,
        language: lang,
        sector,
        created_by: user.id,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

export async function loadConversations(limit = 20) {
  const { data, error } = await supabase
    .from('copilot_conversations')
    .select('id, title, language, sector, created_at, updated_at')
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function loadConversation(id) {
  const { data, error } = await supabase
    .from('copilot_conversations')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}