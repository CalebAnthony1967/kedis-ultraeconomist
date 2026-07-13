/**
 * ============================================================================
 * KEDIS UltraEconomist — Expert RAG Orchestrator (Full Workflow)
 * ============================================================================
 * All 8 stages implemented:
 *   1. Intake & Language Detection
 *   2. Query Understanding (intent + entity extraction)
 *   3. Multi‑query Retrieval (with MCP‑style tools)
 *   4. Validation, Deduplication, Ranking & Confidence
 *   5. Analytical Layer (trend, CAGR, volatility, probability)
 *   6. Format‑aware Answer/Report Generation
 *   7. Post‑processing & Fact‑check
 *   8. Structured Memory Persistence
 * ============================================================================
 */

import { supabase } from './supabaseClient';

// ============================================================
// CONFIGURATION
// ============================================================

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const HF_TOKEN = import.meta.env.VITE_HF_TOKEN;
const HF_MODEL = 'google/flan-t5-xxl';
const HF_URL = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

// ============================================================
// 1. INTAKE & LANGUAGE DETECTION
// ============================================================

function detectLanguage(text) {
  if (!text || text.trim().length === 0) return 'en';
  const swWords = ['je', 'ni', 'ya', 'wa', 'na', 'kwa', 'kwenye', 'kutoka', 'pamoja', 'bila', 'baada', 'kabla', 'hata', 'kama', 'wakati', 'tangu', 'mpaka', 'ingawa', 'kwamba', 'hiyo', 'ile', 'hii', 'hizo', 'zile', 'wale', 'wao', 'yeye', 'mimi', 'sisi', 'nyinyi', 'wewe', 'wenu', 'yetu', 'yangu', 'zangu', 'wangu'];
  const words = text.split(/\s+/);
  const swCount = words.filter(w => swWords.some(sw => new RegExp(`\\b${sw}\\b`, 'i').test(w))).length;
  return (swCount / words.length) > 0.05 ? 'sw' : 'en';
}

function normalizeQuery(text) {
  return text
    .replace(/\bCBK\b/g, 'Central Bank of Kenya')
    .replace(/\bKNBS\b/g, 'Kenya National Bureau of Statistics')
    .replace(/\bGDP\b/g, 'Gross Domestic Product')
    .replace(/\bGVA\b/g, 'Gross Value Added')
    .replace(/\bNBI\b/g, 'Nairobi')
    .replace(/\bMBS\b/g, 'Mombasa')
    .replace(/\bKRA\b/g, 'Kenya Revenue Authority')
    .replace(/\bMTEF\b/g, 'Medium Term Expenditure Framework')
    .trim();
}

function getConversationContext(messages, limit = 5) {
  return messages.slice(-limit).map(m => ({
    role: m.role,
    content: m.content,
    entities: m.entities || [],
  }));
}

// ============================================================
// 2. QUERY UNDERSTANDING (LLM classification)
// ============================================================

async function classifyQuery(query, lang, context = [], previousContext = null) {
  let contextStr = '';
  if (context.length > 0) {
    contextStr = `Previous conversation:\n${context.map(t => `${t.role}: ${t.content}`).join('\n')}`;
  }
  if (previousContext) {
    contextStr += `\nLast query context: intent=${previousContext.intent}, entities=${previousContext.entities?.join(', ') || 'none'}, geography=${previousContext.geography || 'national'}, time_range=${JSON.stringify(previousContext.time_range)}`;
  }

  const prompt = lang === 'sw'
    ? `Tambua swali hili la uchumi na urudishe JSON pekee. Hakikisha hakuna mabano ya markdown.
${contextStr}

{
  "intent": "fact|trend|comparison|report|forecast|definition",
  "pillars": ["macroeconomic","fiscal","trade","agriculture","health","education","county"],
  "entities": ["inflation","GDP growth","public debt"],
  "geography": "national|county_name|regional|global",
  "time_range": {"start": 2020, "end": 2025},
  "output_format": "chat|brief|report",
  "source_preference": ["KNBS","CBK","IMF","World Bank"],
  "confidence": 0.95
}
Swali: ${query}`
    : `Classify this economic query and return ONLY valid JSON. Do NOT wrap in markdown.
${contextStr}

{
  "intent": "fact|trend|comparison|report|forecast|definition",
  "pillars": ["macroeconomic","fiscal","trade","agriculture","health","education","county"],
  "entities": ["inflation","GDP growth","public debt"],
  "geography": "national|county_name|regional|global",
  "time_range": {"start": 2020, "end": 2025},
  "output_format": "chat|brief|report",
  "source_preference": ["KNBS","CBK","IMF","World Bank"],
  "confidence": 0.95
}
Query: ${query}`;

  const systemPrompt = 'You are a classification engine. Return only valid JSON. Do not add any other text.';
  let raw = await callGroq(prompt, systemPrompt);
  if (!raw) raw = await callHF(prompt, systemPrompt);
  if (!raw) {
    return getDefaultClassification(query);
  }
  raw = raw.replace(/```json/g, '').replace(/```/g, '').trim();
  try {
    const parsed = JSON.parse(raw);
    return {
      intent: parsed.intent || 'fact',
      pillars: parsed.pillars || ['macroeconomic'],
      entities: parsed.entities || [],
      geography: parsed.geography || 'national',
      time_range: parsed.time_range || { start: 2000, end: new Date().getFullYear() },
      output_format: parsed.output_format || 'chat',
      source_preference: parsed.source_preference || ['KNBS', 'CBK'],
      confidence: parsed.confidence || 0.8,
    };
  } catch (e) {
    console.warn('JSON parsing failed, using default classification');
    return getDefaultClassification(query);
  }
}

function getDefaultClassification(query) {
  return {
    intent: 'fact',
    pillars: ['macroeconomic'],
    entities: query.split(/\s+/).filter(w => w.length > 3).slice(0, 3),
    geography: 'national',
    time_range: { start: 2000, end: new Date().getFullYear() },
    output_format: 'chat',
    source_preference: ['KNBS', 'CBK'],
    confidence: 0.6,
  };
}

// ============================================================
// 3. MCP‑STYLE RETRIEVAL TOOLS (UPDATED to accept filter)
// ============================================================

async function searchIndicators({
  query,
  pillars = [],
  geography,
  time_range,
  limit = 15,
  source_mcda = null,      // <-- NEW
  temporal_year = null,    // <-- NEW
}) {
  let supabaseQuery = supabase
    .from('indicators')
    .select('*')
    .limit(limit);

  // Apply pillar filter
  if (pillars && pillars.length > 0) {
    const pillarEnum = pillars.map(p => p.charAt(0).toUpperCase() + p.slice(1));
    supabaseQuery = supabaseQuery.in('pillar', pillarEnum);
  }
  // Apply geography
  if (geography && geography !== 'national' && geography !== 'global') {
    supabaseQuery = supabaseQuery.ilike('location_code', `%${geography}%`);
  }
  // Apply time range
  if (time_range && time_range.start) {
    supabaseQuery = supabaseQuery.gte('year', time_range.start);
  }
  if (time_range && time_range.end) {
    supabaseQuery = supabaseQuery.lte('year', time_range.end);
  }

  // ----- NEW: Apply dataset filter -----
  if (source_mcda) {
    supabaseQuery = supabaseQuery.eq('source_mcda', source_mcda);
  }
  if (temporal_year) {
    supabaseQuery = supabaseQuery.eq('year', temporal_year);
  }

  // Full‑text search using ILIKE on search_text
  const words = query.split(/\s+/).filter(w => w.length > 2);
  if (words.length > 0) {
    const conditions = words.map(w => `search_text.ilike.%${w}%`);
    supabaseQuery = supabaseQuery.or(conditions.join(','));
  }

  const { data, error } = await supabaseQuery;
  if (error) {
    console.warn('Search failed:', error);
    return [];
  }
  return data || [];
}

async function getIndicatorSeries(indicatorId, startYear, endYear) {
  const { data, error } = await supabase
    .from('indicators')
    .select('year, value, unit, source_mcda')
    .eq('id', indicatorId)
    .gte('year', startYear || 2000)
    .lte('year', endYear || new Date().getFullYear())
    .order('year', { ascending: true });
  if (error) return [];
  return data || [];
}

async function getInternationalData(indicator, country = 'Kenya', years = [2020, 2024]) {
  console.log('International data requested but not yet implemented');
  return [];
}

// ============================================================
// 4. DATA VALIDATION, RANKING & DEDUPLICATION
// ============================================================

function deduplicateIndicators(indicators) {
  const seen = new Set();
  return indicators.filter(ind => {
    const key = `${ind.id}|${ind.year}|${ind.source_mcda}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function flagStaleData(indicators, threshold = 3) {
  const currentYear = new Date().getFullYear();
  return indicators.map(ind => ({
    ...ind,
    is_stale: (currentYear - ind.year) > threshold,
    staleness_years: currentYear - ind.year,
  }));
}

function rankByEntityMatch(indicators, entities) {
  return indicators.map(ind => {
    const nameLower = (ind.name || '').toLowerCase();
    const sectorLower = (ind.sector || '').toLowerCase();
    let score = 0;
    for (const entity of (entities || [])) {
      const e = entity.toLowerCase();
      if (nameLower.includes(e)) score += 3;
      else if (sectorLower.includes(e)) score += 1;
    }
    return { ...ind, relevance_score: score };
  }).sort((a, b) => b.relevance_score - a.relevance_score);
}

function computeConfidence(foundCount, expectedCount) {
  if (expectedCount === 0) return 1;
  return Math.min(foundCount / expectedCount, 1);
}

function validateAndRank(indicators, classification) {
  const unique = deduplicateIndicators(indicators);
  const flagged = flagStaleData(unique);
  const ranked = rankByEntityMatch(flagged, classification.entities || []);
  const found = new Set(ranked.map(r => r.id)).size;
  const expected = (classification.entities || []).length;
  const confidence = computeConfidence(found, expected);
  const missing = (classification.entities || []).filter(
    e => !ranked.some(r => (r.name || '').toLowerCase().includes(e.toLowerCase()))
  );

  return {
    data: ranked.slice(0, 15),
    confidence,
    found,
    expected,
    missing_entities: missing,
  };
}

// ============================================================
// 5. ANALYTICAL LAYER
// ============================================================

function computeCAGR(series) {
  if (!series || series.length < 2) return null;
  const first = series[0].value;
  const last = series[series.length - 1].value;
  const years = series.length - 1;
  if (first <= 0 || years === 0) return null;
  return (Math.pow(last / first, 1 / years) - 1) * 100;
}

function computeTrend(series) {
  if (!series || series.length < 2) return { slope: 0, direction: 'stable' };
  const n = series.length;
  const x = series.map((_, i) => i);
  const y = series.map(d => d.value);
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((s, xi, i) => s + xi * y[i], 0);
  const sumX2 = x.reduce((s, xi) => s + xi * xi, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const direction = slope > 0.001 ? 'increasing' : slope < -0.001 ? 'decreasing' : 'stable';
  return { slope, direction };
}

function computeVolatility(series) {
  if (!series || series.length < 2) return null;
  const values = series.map(d => d.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function computeProbabilityGeneralized(series, targetValue, targetYear) {
  if (!series || series.length === 0) return null;
  const latest = series[series.length - 1];
  const current = latest.value;
  const currentYear = latest.year;
  const yearsLeft = targetYear - currentYear;
  if (yearsLeft <= 0) return current >= targetValue ? 95 : 20;
  const cagr = computeCAGR(series);
  if (cagr === null) return 50;
  const requiredGrowth = (targetValue - current) / yearsLeft;
  const gap = requiredGrowth - cagr;
  let prob = 100 - (Math.max(0, gap) / 0.05) * 10;
  return Math.min(100, Math.max(0, prob));
}

function extractTargetInfo(query, classification) {
  let target = null, targetYear = null;
  const match = query.match(/(\d+\.?\d*)\s*%?\s*(?:per cent|percent|%)?/i);
  if (match) target = parseFloat(match[1]);
  const yearMatch = query.match(/\b(20[2-9][0-9]|2030|2040|2050)\b/);
  if (yearMatch) targetYear = parseInt(yearMatch[1]);
  if (!targetYear && classification.time_range?.end) targetYear = classification.time_range.end;
  if (!target) target = 10;
  if (!targetYear) targetYear = 2030;
  return { target, targetYear };
}

function computeAnalytics(indicators, classification, query) {
  const results = {};
  const grouped = {};
  for (const ind of indicators) {
    const id = ind.id;
    if (!grouped[id]) grouped[id] = [];
    grouped[id].push({ year: ind.year, value: parseFloat(String(ind.value).replace(/,/g, '')) });
  }
  for (const [id, series] of Object.entries(grouped)) {
    const sorted = series.sort((a, b) => a.year - b.year);
    results[id] = {
      cagr: computeCAGR(sorted),
      trend: computeTrend(sorted),
      volatility: computeVolatility(sorted),
    };
  }
  let probability = null;
  if (classification.intent === 'forecast' || classification.intent === 'report') {
    const { target, targetYear } = extractTargetInfo(query, classification);
    const primaryEntity = classification.entities?.[0] || 'gdp';
    const relevantIndicators = indicators.filter(ind =>
      (ind.name || '').toLowerCase().includes(primaryEntity.toLowerCase())
    );
    if (relevantIndicators.length > 0) {
      const sorted = relevantIndicators.map(ind => ({ year: ind.year, value: parseFloat(String(ind.value).replace(/,/g, '')) })).sort((a, b) => a.year - b.year);
      probability = computeProbabilityGeneralized(sorted, target, targetYear);
    } else {
      const gdpIndicators = indicators.filter(ind => (ind.name || '').toLowerCase().includes('gdp'));
      if (gdpIndicators.length > 0) {
        const sorted = gdpIndicators.map(ind => ({ year: ind.year, value: parseFloat(String(ind.value).replace(/,/g, '')) })).sort((a, b) => a.year - b.year);
        probability = computeProbabilityGeneralized(sorted, target, targetYear);
      }
    }
  }
  return { results, probability };
}

// ============================================================
// 6. CHART GENERATION
// ============================================================

function detectChartRequest(query) {
  const keywords = ['chart', 'graph', 'visualize', 'plot', 'show me', 'display', 'trend', 'compare', 'visualisation'];
  return keywords.some(k => query.toLowerCase().includes(k));
}

function buildChartData(indicators, type = 'line') {
  const groups = {};
  for (const ind of indicators) {
    const key = ind.name || `Indicator ${ind.id || ''}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push({ year: ind.year, value: parseFloat(String(ind.value).replace(/,/g, '')) });
  }

  if (type === 'line' || type === 'area') {
    const years = new Set();
    for (const name in groups) {
      for (const d of groups[name]) years.add(d.year);
    }
    const sortedYears = Array.from(years).sort();
    const chartData = sortedYears.map(year => {
      const row = { year };
      for (const name in groups) {
        const entry = groups[name].find(d => d.year === year);
        row[name] = entry ? entry.value : null;
      }
      return row;
    });
    const series = Object.keys(groups);
    return { type: type, data: chartData, xKey: 'year', series };
  }

  if (type === 'bar') {
    const latestData = [];
    for (const name in groups) {
      const sorted = groups[name].sort((a, b) => a.year - b.year);
      const latest = sorted[sorted.length - 1];
      if (latest) latestData.push({ name, value: latest.value });
    }
    return { type: 'bar', data: latestData, xKey: 'name', yKey: 'value' };
  }

  return null;
}

// ============================================================
// 7. FORMAT‑AWARE ANSWER GENERATION
// ============================================================

function buildPrompt(intent, query, contextText, analytics, lang) {
  const systemBase = lang === 'sw'
    ? 'Wewe ni mshauri mkuu wa uchumi wa Kenya. Tumia data iliyotolewa. Taja SPI zote.'
    : 'You are a senior economic advisor for Kenya. Use the provided data. Cite all SPIs.';

  let systemPrompt = systemBase;
  let userPrompt = '';

  switch (intent) {
    case 'fact':
      systemPrompt += lang === 'sw'
        ? ' Jibu kwa sentensi 2-4, funga na SPI moja.'
        : ' Answer in 2-4 sentences, include one supporting figure and one citation.';
      userPrompt = lang === 'sw'
        ? `Swali: ${query}\n\nData:\n${contextText}\n\nJibu kwa ufupi.`
        : `Question: ${query}\n\nData:\n${contextText}\n\nProvide a concise answer.`;
      break;
    case 'comparison':
      systemPrompt += lang === 'sw'
        ? ' Andika muundo wa kulinganisha: elewa delta na tafsiri.'
        : ' Structure a side‑by‑side comparison with explicit delta and interpretation.';
      userPrompt = lang === 'sw'
        ? `Swali: ${query}\n\nData:\n${contextText}\n\nToa kulinganisha kwa kina.`
        : `Question: ${query}\n\nData:\n${contextText}\n\nProvide a detailed comparison.`;
      break;
    case 'report':
      systemPrompt += lang === 'sw'
        ? ' Andika ripoti kamili: Muhtasari → Uchambuzi → Mapendekezo → Vyanzo.'
        : ' Write a full report: Executive Summary → Analysis → Recommendations → Sources.';
      userPrompt = lang === 'sw'
        ? `Swali: ${query}\n\nData:\n${contextText}\n\nAndika ripoti ya kitaalamu.`
        : `Question: ${query}\n\nData:\n${contextText}\n\nWrite a professional report.`;
      break;
    case 'forecast':
      systemPrompt += lang === 'sw'
        ? ' Eleza mbinu, ingizo, makadirio, na kikomo cha uaminifu.'
        : ' State the method, inputs, estimate, and confidence limits.';
      userPrompt = lang === 'sw'
        ? `Swali: ${query}\n\nData:\n${contextText}\n\nToa utabiri na uaminifu.`
        : `Question: ${query}\n\nData:\n${contextText}\n\nProvide a forecast with confidence.`;
      break;
    case 'trend':
      systemPrompt += lang === 'sw'
        ? ' Eleza mwelekeo, kasi ya ukuaji (CAGR), na mabadiliko kwa wakati.'
        : ' Describe the trend, growth rate (CAGR), and changes over time.';
      userPrompt = lang === 'sw'
        ? `Swali: ${query}\n\nData:\n${contextText}\n\nToa uchambuzi wa mwelekeo.`
        : `Question: ${query}\n\nData:\n${contextText}\n\nProvide trend analysis.`;
      break;
    case 'definition':
      systemPrompt += lang === 'sw'
        ? ' Toa ufafanuzi wazi wa dhana, pamoja na mfano au data inayounga mkono.'
        : ' Provide a clear definition, with a supporting example or data.';
      userPrompt = lang === 'sw'
        ? `Swali: ${query}\n\nData:\n${contextText}\n\nFafanua dhana.`
        : `Question: ${query}\n\nData:\n${contextText}\n\nDefine the concept.`;
      break;
    default:
      userPrompt = lang === 'sw'
        ? `Swali: ${query}\n\nData:\n${contextText}\n\nJibu.`
        : `Question: ${query}\n\nData:\n${contextText}\n\nAnswer.`;
  }

  if (analytics && analytics.results && (intent === 'trend' || intent === 'forecast' || intent === 'report')) {
    const analyticsText = Object.entries(analytics.results).map(([id, a]) => {
      const cagr = a.cagr !== null ? a.cagr.toFixed(2) : 'N/A';
      const vol = a.volatility !== null ? a.volatility.toFixed(2) : 'N/A';
      return `- Indicator ${id}: CAGR ${cagr}%, trend ${a.trend.direction}, volatility ${vol}`;
    }).join('\n');
    userPrompt += lang === 'sw'
      ? `\n\nUchambuzi uliokokotwa:\n${analyticsText}`
      : `\n\nComputed analytics:\n${analyticsText}`;
  }

  return { systemPrompt, userPrompt };
}

// ============================================================
// 8. POST‑PROCESSING & FACT‑CHECK
// ============================================================

function factCheck(answer, retrievedData) {
  if (!answer) return answer;
  const numbers = answer.match(/\d+\.?\d*/g) || [];
  const valueSet = new Set();
  for (const row of retrievedData) {
    const val = String(row.value).replace(/,/g, '');
    valueSet.add(val);
    valueSet.add(row.value);
  }
  const bound = numbers.map(num => {
    const found = valueSet.has(num) || valueSet.has(num.replace(/,/g, ''));
    return { value: num, found };
  });
  const unbound = bound.filter(b => !b.found);
  const suspicious = unbound.filter(b => !/^\d{4}$/.test(b.value) && parseFloat(b.value) > 1);
  if (suspicious.length > 0 && suspicious.length <= 5) {
    answer += `\n\n**Note:** The following figures could not be verified against retrieved data: ${suspicious.map(b => b.value).join(', ')}. Please verify independently.`;
  }
  return answer;
}

function ensureLanguage(answer, lang) {
  if (!answer) return answer;
  const swWords = ['ni', 'ya', 'wa', 'na', 'kwa', 'kwenye', 'kutoka', 'pamoja', 'bila'];
  const hasSw = swWords.some(w => new RegExp(`\\b${w}\\b`, 'i').test(answer));
  if (lang === 'sw' && !hasSw) {
    answer += '\n\n*Note: Response is in English. Requested language was Swahili.*';
  }
  return answer;
}

// ============================================================
// 9. STRUCTURED MEMORY PERSISTENCE
// ============================================================

export async function saveStructuredTurn(conversationId, turnData) {
  const { query, classification, answer, spiCitations, retrievedIndicatorIds, analytics } = turnData;
  if (!conversationId) return;
  const { data: conv, error } = await supabase
    .from('copilot_conversations')
    .select('messages')
    .eq('id', conversationId)
    .single();
  if (error) {
    console.warn('Could not fetch conversation for update:', error);
    return;
  }
  const messages = conv.messages || [];
  const newMessages = [
    ...messages,
    {
      role: 'user',
      content: query,
      entities: classification.entities || [],
      intent: classification.intent || 'fact',
    },
    {
      role: 'assistant',
      content: answer,
      spi_citations: spiCitations || [],
      probability_score: analytics?.probability || null,
    },
  ];

  const structuredContext = {
    last_intent: classification.intent || 'fact',
    last_entities: classification.entities || [],
    last_geography: classification.geography || 'national',
    last_time_range: classification.time_range || { start: 2000, end: new Date().getFullYear() },
    last_pillars: classification.pillars || [],
  };

  await supabase
    .from('copilot_conversations')
    .update({
      messages: newMessages,
      structured_context: structuredContext,
      retrieved_indicator_ids: retrievedIndicatorIds || [],
      analysis: analytics || {},
      updated_at: new Date().toISOString(),
    })
    .eq('id', conversationId);
}

// ============================================================
// 10. MAIN runRAG ORCHESTRATOR (FULL WORKFLOW)
// ============================================================

export async function runRAG(query, filter, lang = 'en', messages = [], conversationId = null, previousContext = null) {
  // ---------- STAGE 1: INTAKE ----------
  const detectedLang = detectLanguage(query) || lang;
  const normalizedQuery = normalizeQuery(query);
  const context = getConversationContext(messages);

  // ---------- STAGE 2: QUERY UNDERSTANDING ----------
  const classification = await classifyQuery(normalizedQuery, detectedLang, context, previousContext);
  classification.language = detectedLang;

  // ---------- STAGE 3: RETRIEVAL (multi‑query, parallel) ----------
  // Extract dataset filter from the filter object
  let sourceFilter = null;
  let yearFilter = null;
  if (filter?.type === 'source' && filter?.value) {
    sourceFilter = filter.value;
  } else if (filter?.type === 'job' && filter?.value?.source_mcda) {
    sourceFilter = filter.value.source_mcda;
    if (filter.value.temporal_year) {
      yearFilter = filter.value.temporal_year;
    }
  }

  const entities = classification.entities || [];
  const searchPromises = entities.map(entity =>
    searchIndicators({
      query: entity,
      pillars: classification.pillars,
      geography: classification.geography,
      time_range: classification.time_range,
      limit: 10,
      source_mcda: sourceFilter,
      temporal_year: yearFilter,
    })
  );
  // Also broad search
  const broadPromise = searchIndicators({
    query: normalizedQuery,
    pillars: classification.pillars,
    geography: classification.geography,
    time_range: classification.time_range,
    limit: 10,
    source_mcda: sourceFilter,
    temporal_year: yearFilter,
  });
  const results = await Promise.all([...searchPromises, broadPromise]);
  let allIndicators = [];
  for (const res of results) {
    allIndicators = [...allIndicators, ...res];
  }

  // ---------- STAGE 4: VALIDATE & RANK ----------
  const validated = validateAndRank(allIndicators, classification);
  const topIndicators = validated.data;
  const confidence = validated.confidence;
  const missing = validated.missing_entities;

  let confidenceNote = '';
  if (confidence < 0.5 && missing.length > 0) {
    confidenceNote = detectedLang === 'sw'
      ? `Uaminifu wa data ni mdogo. Baadhi ya viashiria vilivyoombwa havipatikani: ${missing.join(', ')}`
      : `Data confidence is low. Some requested indicators are missing: ${missing.join(', ')}`;
  }

  // ---------- STAGE 5: ANALYTICS ----------
  let analyticsData = topIndicators;
  if (classification.intent === 'trend' || classification.intent === 'forecast') {
    const primaryEntity = classification.entities?.[0];
    if (primaryEntity) {
      const primaryIndicators = topIndicators.filter(ind =>
        (ind.name || '').toLowerCase().includes(primaryEntity.toLowerCase())
      );
      if (primaryIndicators.length > 0) {
        const primaryId = primaryIndicators[0].id;
        const series = await getIndicatorSeries(primaryId, classification.time_range?.start || 2000, classification.time_range?.end || new Date().getFullYear());
        if (series.length > 0) {
          analyticsData = series.map(s => ({ ...s, id: primaryId }));
        }
      }
    }
  }
  const analytics = computeAnalytics(analyticsData, classification, normalizedQuery);

  // ---------- STAGE 6: CHART GENERATION ----------
  let chart = null;
  if (detectChartRequest(normalizedQuery) && topIndicators.length > 0) {
    let chartType = 'line';
    if (normalizedQuery.toLowerCase().includes('bar')) chartType = 'bar';
    else if (normalizedQuery.toLowerCase().includes('area')) chartType = 'area';
    chart = buildChartData(topIndicators, chartType);
  }

  // ---------- STAGE 7: BUILD PROMPT & GENERATE ----------
  const contextText = topIndicators.length > 0
    ? topIndicators.slice(0, 10).map(ind =>
        `- ${ind.name} (${ind.year}): ${ind.value} ${ind.unit} | ${ind.source_mcda} | SPI: ${ind.spi || 'N/A'}`
      ).join('\n')
    : 'No data found.';

  const { systemPrompt, userPrompt } = buildPrompt(
    classification.intent,
    normalizedQuery,
    contextText,
    analytics,
    detectedLang
  );

  let answer = await callGroq(userPrompt, systemPrompt);
  if (!answer) answer = await callHF(userPrompt, systemPrompt);
  if (!answer) {
    answer = generateStructuredAnswer(normalizedQuery, topIndicators, detectedLang);
  }

  // ---------- STAGE 8: POST‑PROCESSING ----------
  answer = factCheck(answer, topIndicators);
  answer = ensureLanguage(answer, detectedLang);
  if (confidenceNote) {
    answer = confidenceNote + '\n\n' + answer;
  }

  // ---------- STAGE 9: STRUCTURED MEMORY ----------
  const spiCitations = topIndicators.map(ind => ind.spi).filter(Boolean);
  const indicatorIds = topIndicators.map(ind => ind.id).filter(Boolean);

  if (conversationId) {
    await saveStructuredTurn(conversationId, {
      query: normalizedQuery,
      classification,
      answer,
      spiCitations,
      retrievedIndicatorIds: indicatorIds,
      analytics: analytics,
    });
  }

  return {
    answer,
    chart,
    spi_citations: spiCitations.slice(0, 10),
    probability_score: analytics.probability || null,
    context_count: topIndicators.length,
    retrieved_indicators: topIndicators.slice(0, 10).map(ind => ({
      name: ind.name,
      year: ind.year,
      value: ind.value,
      unit: ind.unit,
      source_mcda: ind.source_mcda,
      spi: ind.spi,
      id: ind.id,
    })),
    classification,
    analytics: analytics.results,
    confidence,
    missing_entities: missing,
  };
}

// ============================================================
// 11. CONVERSATION MANAGEMENT
// ============================================================

export async function saveConversation(conversationId, messages, title, language, sector) {
  const user = await supabase.auth.getUser();
  const userId = user.data.user?.id;
  const payload = {
    title: title || 'New Conversation',
    messages: messages || [],
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
    .select('id, title, sector, updated_at, structured_context, retrieved_indicator_ids, analysis')
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getConversation(conversationId) {
  const { data, error } = await supabase
    .from('copilot_conversations')
    .select('*')
    .eq('id', conversationId)
    .single();
  if (error) throw error;
  return data;
}

export async function routeToPS(message) {
  console.log('Routed to PS:', message);
  return { success: true };
}

// ============================================================
// 12. HELPER: generateStructuredAnswer (fallback)
// ============================================================

function generateStructuredAnswer(query, indicators, lang) {
  if (!indicators || indicators.length === 0) {
    return lang === 'sw'
      ? 'Hakuna data inayolingana na swali lako. Jaribu kubadilisha maneno au chagua chanzo tofauti.'
      : 'No data matches your query. Try rephrasing or selecting a different source.';
  }

  const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const relevant = indicators.filter(ind =>
    keywords.some(k => (ind.name || '').toLowerCase().includes(k) || (ind.sector || '').toLowerCase().includes(k))
  );
  const top = relevant.length > 0 ? relevant : indicators.slice(0, 5);

  const summary = top.map(ind =>
    `${ind.name} (${ind.year}): ${ind.value} ${ind.unit} (${ind.source_mcda})`
  ).join('; ');

  const spis = top.map(ind => ind.spi).filter(Boolean).slice(0, 5).join(', ');

  let prob = null;
  const gdp = indicators.filter(ind => (ind.name || '').toLowerCase().includes('gdp'));
  if (gdp.length > 0) {
    const latest = gdp.sort((a, b) => b.year - a.year)[0];
    const val = parseFloat(String(latest.value).replace(/,/g, ''));
    if (!isNaN(val)) {
      if (val >= 10) prob = 90;
      else if (val >= 8) prob = 70;
      else if (val >= 6) prob = 50;
      else if (val >= 4) prob = 30;
      else prob = 20;
    }
  }
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
// 13. AI CALLERS
// ============================================================

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
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1500,
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

async function callHF(prompt, systemPrompt, retries = 2) {
  if (!HF_TOKEN) {
    console.warn('HF token missing.');
    return null;
  }
  const fullPrompt = `${systemPrompt}\n\n${prompt}`;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      console.log(`🟡 Calling HuggingFace (attempt ${attempt+1})...`);
      const resp = await fetch(HF_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: fullPrompt,
          parameters: {
            max_new_tokens: 800,
            temperature: 0.3,
            return_full_text: false,
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
      if (e.message.includes('ERR_NAME_NOT_RESOLVED')) {
        console.warn('DNS resolution failed. Please check your internet/DNS settings.');
      }
      await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  return null;
}
