/**
 * AlphaEconomist 2.0 — Advanced Agentic RAG Pipeline
 */

import { classifyQuery } from './classifier';
import { retrieveData, getDistinctIndicators } from './retriever';
import { callGroq, streamGroq } from './providers/groq';
import { callHuggingFace } from './providers/huggingface';
import { buildConversationContext } from './memory';
import { computeDataStatistics, formatStatisticsMarkdown } from './mathEngine';
import { buildSystemPrompt, buildUserPrompt } from './promptTemplates';
import { resolveContextualQuery, calculateConfidenceScore } from './queryPlanner';

export async function runRAG(query, conversationHistory = [], options = {}) {
  const {
    conversationId,
    filterContext = {},
    onChunk,
    maxTokens = 1200,
    temperature = 0.4, // Lower temperature for high factual accuracy
  } = options;

  console.log('🧠 [AlphaEconomist 2.0] Analyzing query:', query);

  // ============================================================
  // STEP 1: Context Resolution & Anaphora Handling
  // ============================================================
  const { resolvedQuery, inheritedGeography } = resolveContextualQuery(query, conversationHistory);

  // ============================================================
  // STEP 2: Query Classification
  // ============================================================
  let classification = await classifyQuery(resolvedQuery, conversationHistory);
  if (!classification.geography && inheritedGeography) {
    classification.geography = inheritedGeography;
  }

  console.log('📋 [AlphaEconomist 2.0] Execution Plan:', {
    intent: classification.intent,
    geography: classification.geography?.name || 'National',
    time_range: classification.time_range,
  });

  // ============================================================
  // STEP 3: Multi-Strategy Retrieval
  // ============================================================
  let retrievedData = [];

  if (classification.intent === 'listing') {
    retrievedData = await getDistinctIndicators(classification.geography);
  } else {
    retrievedData = await retrieveData(resolvedQuery, classification, {
      ...filterContext,
      geography: classification.geography,
      time_range: classification.time_range,
    });
  }

  // Broaden retrieval if county-specific search returned nothing
  if (retrievedData.length === 0 && classification.geography?.code) {
    console.log('🔄 Broadening search without geography constraint...');
    retrievedData = await retrieveData(resolvedQuery, { ...classification, geography: null });
  }

  // ============================================================
  // STEP 4: Deterministic Math Computation Engine
  // ============================================================
  const stats = computeDataStatistics(retrievedData);
  const statisticsMarkdown = formatStatisticsMarkdown(stats);

  // ============================================================
  // STEP 5: Format Raw Grounding Context
  // ============================================================
  const contextText = retrievedData.slice(0, 25).map(ind => {
    const valStr = ind.value !== null && ind.value !== undefined
      ? typeof ind.value === 'number' ? ind.value.toLocaleString() : ind.value
      : 'N/A';
    const spiStr = ind.spi ? ` | SPI: ${ind.spi}` : '';
    const sourceStr = ind.source_mcda ? ` | Source: ${ind.source_mcda}` : '';
    const geoStr = ind.county_name ? ` (${ind.county_name})` : '';
    return `- **${ind.name}**${geoStr} [${ind.year || 'N/A'}]: ${valStr} ${ind.unit || ''}${sourceStr}${spiStr}`;
  }).join('\n');

  // ============================================================
  // STEP 6: Assemble Prompts & Execute LLM Generation
  // ============================================================
  const historyContext = buildConversationContext(conversationHistory);
  const systemPrompt = buildSystemPrompt({
    classification,
    language: filterContext.lang || 'en',
    hasData: retrievedData.length > 0,
  });

  const userPrompt = buildUserPrompt({
    query: resolvedQuery,
    contextText,
    statisticsMarkdown,
    historyContext,
    classification,
  });

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-4).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userPrompt },
  ];

  let response = null;
  let provider = 'groq';

  // Execute Groq with streaming support
  if (onChunk) {
    try {
      const streamResult = await streamGroq(messages, onChunk, { maxTokens, temperature });
      if (streamResult) {
        response = { content: streamResult, provider: 'groq' };
      }
    } catch (err) {
      console.warn('Groq streaming failed, falling back to direct call:', err);
    }
  }

  if (!response) {
    response = await callGroq(messages, { maxTokens, temperature });
  }

  // Fallback to HuggingFace
  if (!response) {
    console.log('🔄 Primary LLM unavailable, switching to HuggingFace fallback...');
    response = await callHuggingFace(messages, { maxTokens: Math.min(maxTokens, 600), temperature });
    provider = 'huggingface';
  }

  // Ultimate Rule-based fallback if all LLMs fail
  if (!response || !response.content) {
    response = {
      content: generateDeterministicFallback(resolvedQuery, retrievedData, stats, classification),
      provider: 'deterministic_engine',
    };
  }

  // ============================================================
  // STEP 7: Compute Grounded Citations & Dynamic Suggestions
  // ============================================================
  const confidence = calculateConfidenceScore(retrievedData, classification);
  const uniqueCitations = Array.from(new Set(retrievedData.map(d => d.spi).filter(Boolean)));
  const suggestedQuestions = generateSmartFollowUps(classification, retrievedData, stats);

  return {
    answer: response.content,
    data: retrievedData,
    classification,
    provider: response.provider || provider,
    confidence,
    citations: uniqueCitations,
    suggested_questions: suggestedQuestions,
    analytics: stats?.summaries || null,
  };
}

/**
 * Robust Deterministic Fallback Builder
 */
function generateDeterministicFallback(query, data, stats, classification) {
  if (!data || data.length === 0) {
    return `### ⚠️ Data Notice
I was unable to retrieve specific records for **"${query}"** in the sovereign data pool. 
Please verify the county name or try selecting related economic indicators from the navigation tree.`;
  }

  let text = `### 📊 Sovereign Data Summary for ${classification.geography?.name || 'Kenya'}\n\n`;
  if (stats && stats.summaries.length > 0) {
    text += formatStatisticsMarkdown(stats);
  }

  text += `\n*Retrieved ${data.length} official indicators matching your parameters.*`;
  return text;
}

/**
 * Dynamic Context-Aware Follow-up Generator
 */
function generateSmartFollowUps(classification, data, stats) {
  const suggestions = [];
  const geo = classification.geography?.name;

  if (geo) {
    suggestions.push(`Compare ${geo}'s GDP and revenue with neighboring counties`);
    suggestions.push(`What are the top agricultural and health indicators for ${geo}?`);
  } else {
    suggestions.push('Show me county-level comparison for this indicator');
    suggestions.push('What are the historical 5-year trends?');
  }

  if (stats && stats.summaries.length > 0) {
    const topInd = stats.summaries[0].indicator;
    suggestions.push(`Break down the economic drivers behind "${topInd}"`);
  }

  return suggestions.slice(0, 3);
}

export default { runRAG };
