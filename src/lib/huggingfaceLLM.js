/**
 * ============================================================================
 * KEDIS UltraEconomist — Intelligent RAG Orchestrator (FIXED)
 * ============================================================================
 * Primary: Groq (Llama 3.3 70B) - Fast, free tier available
 * Secondary: HuggingFace (Flan-T5-XXL) - Reliable fallback
 * Tertiary: OpenAI (GPT-4o-mini) - Uncomment if you have credits
 * RAG: Uses Supabase full-text search with a simplified, working approach.
 * ============================================================================
 */

import { supabase } from './supabaseClient';

// ============================================================
// CONFIGURATION (Read from .env.local)
// ============================================================

// --- Groq (Primary) ---
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
// ✅ FIXED: Using a model that is NOT deprecated
const GROQ_MODEL = 'llama-3.3-70b-versatile'; 
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// --- HuggingFace (Secondary) ---
const HF_TOKEN = import.meta.env.VITE_HF_TOKEN;
const HF_MODEL = 'google/flan-t5-xxl';
const HF_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

// --- OpenAI (Tertiary - Optional) ---
// Uncomment if you have credits and want to use it.
// const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
// const OPENAI_MODEL = 'gpt-4o-mini';
// const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

// ============================================================
// 1. RAG – Simplified & Reliable Retrieval
// ============================================================

/**
 * Retrieves relevant indicators using a simple, working approach.
 * It uses ILIKE for flexibility and avoids complex ts_rank syntax errors.
 */
async function retrieveIndicators(query, filter, limit = 15) {
  try {
    // Extract meaningful keywords from the query
    const words = query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2);

    // If no keywords, return empty
    if (words.length === 0) {
      return [];
    }

    let supabaseQuery = supabase
      .from('indicators')
      .select('*')
      .limit(limit);

    // Apply dataset filter if any
    if (filter?.type === 'source' && filter?.value) {
      supabaseQuery = supabaseQuery.eq('source_mcda', filter.value);
    } else if (filter?.type === 'job' && filter?.value?.source_mcda) {
      supabaseQuery = supabaseQuery.eq('source_mcda', filter.value.source_mcda);
      if (filter.value.temporal_year) {
        supabaseQuery = supabaseQuery.eq('year', filter.value.temporal_year);
      }
    }

    // Build OR conditions for each keyword across relevant columns
    // This is a simplified, foolproof approach that works without ts_rank errors.
    const conditions = words.map(w => 
      `search_text.ilike.%${w}%`
    );
    supabaseQuery = supabaseQuery.or(conditions.join(','));

    const { data, error } = await supabaseQuery;
    if (error) {
      console.warn('Supabase query failed, falling back to basic search:', error);
      // Fallback: A very simple search on name only
      const simpleQuery = supabase
        .from('indicators')
        .select('*')
        .limit(limit)
        .ilike('name', `%${words[0]}%`);
      
      if (filter?.type === 'source') simpleQuery.eq('source_mcda', filter.value);
      else if (filter?.type === 'job') simpleQuery.eq('source_mcda', filter.value.source_mcda);
      
      const { data: fallbackData, error: fallbackError } = await simpleQuery;
      if (fallbackError) throw fallbackError;
      return fallbackData || [];
    }

    return data || [];
  } catch (e) {
    console.warn('Retrieval failed:', e);
    return [];
  }
}

// ============================================================
// 2. AI Callers with detailed logging & fallback
// ============================================================

/**
 * Calls Groq API (Primary - Fastest, free tier available)
 */
async function callGroq(prompt, systemPrompt) {
  if (!GROQ_API_KEY || GROQ_API_KEY.startsWith('gsk_PASTE')) {
    console.warn('Groq key missing or placeholder.');
    return null;
  }
  try {
    console.log('🟢 Calling Groq...');
    const resp = await fetch(GROQ_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${GROQ_API_KEY}` 
      },
      body: JSON.stringify({
        model: GROQ_MODEL, // ✅ FIXED: Using a supported model
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,  // ✅ INCREASED for full reports
      }),
    });
    if (!resp.ok) {
      const err = await resp.json();
      console.error('Groq error:', err);
      throw new Error(`Groq ${resp.status}: ${err.error?.message || resp.statusText}`);
    }
    const data = await resp.json();
    console.log('✅ Groq success');
    return data.choices[0].message.content.trim();
  } catch (e) {
    console.warn('Groq failed:', e.message);
    return null;
  }
}

/**
 * Calls HuggingFace API (Secondary - Reliable fallback)
 */
async function callHF(prompt, systemPrompt, retries = 2) {
  if (!HF_TOKEN) {
    console.warn('HF token missing.');
    return null;
  }
  // HF expects a single string input
  const fullPrompt = `${systemPrompt}\n\n${prompt}`;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      console.log(`🟡 Calling HuggingFace (attempt ${attempt+1})...`);
      const resp = await fetch(HF_URL, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${HF_TOKEN}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({
          inputs: fullPrompt,
          parameters: { 
            max_new_tokens: 800,  // ✅ INCREASED
            temperature: 0.3, 
            return_full_text: false 
          },
        }),
      });
      if (!resp.ok) {
        const err = await resp.text();
        console.error(`HF error (${resp.status}):`, err);
        throw new Error(`HF ${resp.status}: ${err}`);
      }
      const data = await resp.json();
      if (data.generated_text) {
        console.log('✅ HF success');
        return data.generated_text;
      }
      throw new Error('Unexpected HF response');
    } catch (e) {
      console.warn(`HF attempt ${attempt+1} failed:`, e.message);
      // The DNS error is likely a network issue on your side.
      if (e.message.includes('ERR_NAME_NOT_RESOLVED')) {
        console.warn('DNS resolution failed. Please check your internet/DNS settings.');
      }
      await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  return null;
}

/**
 * Calls OpenAI API (Tertiary - Uncomment if you have credits)
 */
// async function callOpenAI(prompt, systemPrompt) {
//   if (!OPENAI_API_KEY || OPENAI_API_KEY.startsWith('sk-PASTE')) {
//     console.warn('OpenAI key missing or placeholder.');
//     return null;
//   }
//   try {
//     console.log('🔵 Calling OpenAI...');
//     const resp = await fetch(OPENAI_URL, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
//       body: JSON.stringify({
//         model: OPENAI_MODEL,
//         messages: [
//           { role: 'system', content: systemPrompt },
//           { role: 'user', content: prompt },
//         ],
//         temperature: 0.7,
//         max_tokens: 600,
//       }),
//     });
//     if (!resp.ok) {
//       const err = await resp.json();
//       console.error('OpenAI error:', err);
//       throw new Error(`OpenAI ${resp.status}: ${err.error?.message || resp.statusText}`);
//     }
//     const data = await resp.json();
//     console.log('✅ OpenAI success');
//     return data.choices[0].message.content.trim();
//   } catch (e) {
//     console.warn('OpenAI failed:', e.message);
//     return null;
//   }
// }

// ============================================================
// 3. Probability Score (simple heuristic)
// ============================================================

function computeProbability(indicators) {
  const gdp = indicators.filter(ind =>
    ind.name.toLowerCase().includes('gdp') ||
    ind.name.toLowerCase().includes('growth')
  );
  if (gdp.length === 0) return null;
  const latest = gdp.sort((a, b) => b.year - a.year)[0];
  const val = parseFloat(latest.value);
  if (isNaN(val)) return null;
  if (val >= 10) return 90;
  if (val >= 8) return 70;
  if (val >= 6) return 50;
  if (val >= 4) return 30;
  return 20;
}

// ============================================================
// 4. Generate a structured answer from retrieved data (fallback)
// ============================================================

function generateStructuredAnswer(query, indicators, lang) {
  if (indicators.length === 0) {
    return lang === 'sw'
      ? 'Hakuna data inayolingana na swali lako. Jaribu kubadilisha maneno au chagua chanzo tofauti.'
      : 'No data matches your query. Try rephrasing or selecting a different source.';
  }

  const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const relevant = indicators.filter(ind =>
    keywords.some(k => ind.name.toLowerCase().includes(k) || ind.sector.toLowerCase().includes(k))
  );
  const top = relevant.length > 0 ? relevant : indicators.slice(0, 5);

  const summary = top.map(ind =>
    `${ind.name} (${ind.year}): ${ind.value} ${ind.unit} (${ind.source_mcda})`
  ).join('; ');

  const spis = top.map(ind => ind.spi).filter(Boolean).slice(0, 5).join(', ');

  const prob = computeProbability(indicators);
  let probText = '';
  if (prob !== null) {
    probText = lang === 'sw'
      ? `Uwezekano wa kufikia lengo ni karibu ${prob}%.`
      : `Probability of achieving the target is approximately ${prob}%.`;
  }

  return lang === 'sw'
    ? `Kulingana na data iliyopo:\n${summary}\n\n${probText}\nSPI zilizotumika: ${spis || 'Hazijapatikana'}`
    : `Based on available data:\n${summary}\n\n${probText}\nSPIs referenced: ${spis || 'None found'}`;
}

// ============================================================
// 5. Main RAG Function
// ============================================================

export async function runRAG(query, filter, lang = 'en', messages = []) {
  // Retrieve data
  const indicators = await retrieveIndicators(query, filter);

  // Build context (short)
  const contextText = indicators.length > 0
    ? indicators.slice(0, 10).map(ind =>
        `- ${ind.name} (${ind.year}): ${ind.value} ${ind.unit} | ${ind.source_mcda} | SPI: ${ind.spi || 'N/A'}`
      ).join('\n')
    : 'No data found.';

  // ✅ UPDATED system prompt – adapts to the question
  const systemPrompt = lang === 'sw'
    ? 'Wewe ni mshauri mkuu wa uchumi. Jibu kwa Kiswahili kwa mtindo unaofaa swali: ikiwa swali linaomba ripoti, toa ripoti kamili; ikiwa ni swali fupi, jibu kwa ufupi lakini kwa uchambuzi. Tumia data iliyotolewa na taja SPI zote.'
    : 'You are a senior economic advisor. Answer in English in a style appropriate to the question: if asked for a report, produce a full report; if a short question, give a concise but analytical answer. Use the provided data and cite all SPIs.';

  const userPrompt = lang === 'sw'
    ? `Swali: ${query}\n\nData:\n${contextText}\n\nJibu.`
    : `Question: ${query}\n\nData:\n${contextText}\n\nAnswer.`;

  // Try AI providers: Groq -> HF -> (OpenAI optional)
  let answer = await callGroq(userPrompt, systemPrompt);
  if (!answer) answer = await callHF(userPrompt, systemPrompt);
  // if (!answer) answer = await callOpenAI(userPrompt, systemPrompt);

  // If all fail, generate structured fallback
  if (!answer) {
    console.warn('All AI providers failed. Using structured fallback.');
    answer = generateStructuredAnswer(query, indicators, lang);
  }

  // Extract SPIs
  const spiCitations = indicators.map(ind => ind.spi).filter(Boolean);

  // Probability
  let probabilityScore = null;
  if (query.toLowerCase().includes('probabil') || query.includes('uwezekano')) {
    probabilityScore = computeProbability(indicators);
  }

  return {
    answer,
    spi_citations: spiCitations.slice(0, 10),
    probability_score: probabilityScore,
    context_count: indicators.length,
    retrieved_indicators: indicators.slice(0, 10).map(ind => ({
      name: ind.name,
      year: ind.year,
      value: ind.value,
      unit: ind.unit,
      source_mcda: ind.source_mcda,
      spi: ind.spi,
    })),
  };
}

// ============================================================
// 6. Conversation management (unchanged)
// ============================================================

export async function saveConversation(conversationId, messages, title, language, sector) {
  const user = await supabase.auth.getUser();
  const userId = user.data.user?.id;
  const payload = {
    title: title || 'New Conversation',
    messages,
    language: language || 'en',
    sector: sector || 'General',
    updated_at: new Date().toISOString(),
  };
  if (conversationId) {
    const { data, error } = await supabase
      .from('copilot_conversations')
      .update(payload)
      .eq('id', conversationId)
      .select('id')
      .single();
    if (error) throw error;
    return { id: conversationId };
  } else {
    const { data, error } = await supabase
      .from('copilot_conversations')
      .insert({ ...payload, created_by: userId })
      .select('id')
      .single();
    if (error) throw error;
    return { id: data.id };
  }
}

export async function loadConversations(limit = 10) {
  const { data, error } = await supabase
    .from('copilot_conversations')
    .select('id, title, sector, updated_at')
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function routeToPS(message) {
  console.log('Routed to PS:', message);
  return { success: true };
}