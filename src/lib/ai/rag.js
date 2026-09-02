/**
 * RAG Pipeline – Enhanced with proper query understanding
 */

import { classifyQuery } from './classifier';
import { retrieveData, getDistinctIndicators } from './retriever';
import { callGroq, streamGroq } from './providers/groq';
import { callHuggingFace } from './providers/huggingface';
import { buildConversationContext } from './memory';

/**
 * Main RAG pipeline with enhanced query understanding
 */
export async function runRAG(query, conversationHistory = [], options = {}) {
  const {
    conversationId,
    filterContext = {},
    onChunk,
    maxTokens = 800,
    temperature = 0.7,
  } = options;

  console.log('🧠 Running RAG pipeline for:', query);

  // ============================================================
  // STEP 1: Classify query (extract intent, entities, geography)
  // ============================================================
  const classification = await classifyQuery(query, conversationHistory);
  console.log('📋 Classification:', classification);

  // ============================================================
  // STEP 2: Build context from conversation history
  // ============================================================
  const historyContext = buildConversationContext(conversationHistory);

  // ============================================================
  // STEP 3: Retrieve data based on classification
  // ============================================================
  let retrievedData = [];
  
  // Special handling for "listing" intent
  if (classification.intent === 'listing') {
    // Get distinct indicators for the geography
    retrievedData = await getDistinctIndicators(classification.geography);
    console.log(`📊 Found ${retrievedData.length} distinct indicators`);
  } else {
    // Normal retrieval
    retrievedData = await retrieveData(query, classification, { 
      ...filterContext,
      geography: classification.geography,
      time_range: classification.time_range,
    });
    console.log(`📊 Retrieved ${retrievedData.length} indicators`);
  }

  // ============================================================
  // STEP 4: If no data, broaden the search
  // ============================================================
  if (retrievedData.length === 0 && classification.geography?.code) {
    console.log('No data, trying broader search...');
    // Try without geography filter
    const broadData = await retrieveData(query, { ...classification, geography: null });
    retrievedData = broadData;
  }

  // ============================================================
  // STEP 5: Build context for LLM
  // ============================================================
  let contextText = '';
  
  if (classification.intent === 'listing') {
    // Format as a list for listing intent
    const indicators = retrievedData.slice(0, 20);
    contextText = indicators.map(ind => 
      `- ${ind.name} (${ind.unit || 'N/A'}) | Sector: ${ind.sector || 'N/A'} | Source: ${ind.source_mcda || 'Unknown'}`
    ).join('\n');
  } else {
    // Format as data points
    contextText = retrievedData.slice(0, 10).map(ind => {
      const value = ind.value !== null && ind.value !== undefined 
        ? typeof ind.value === 'number' 
          ? ind.value.toLocaleString(undefined, { maximumFractionDigits: 2 })
          : ind.value
        : 'N/A'
      return `- ${ind.name} (${ind.year}): ${value} ${ind.unit || ''} | Source: ${ind.source_mcda || 'Unknown'}`
    }).join('\n');
  }

  // ============================================================
  // STEP 6: Generate response with LLM
  // ============================================================
  const systemPrompt = `You are AlphaEconomist, a senior economic advisor for Kenya.

Context:
- Query intent: ${classification.intent}
- Geography: ${classification.geography?.type || 'National'} ${classification.geography?.name || ''}
- Time range: ${classification.time_range?.start || 'N/A'} - ${classification.time_range?.end || 'N/A'}
- Output format: ${classification.output_format}

Guidelines:
1. If the user asks "what are the indicators", list the indicators with their units and sources
2. Use the provided data to answer questions
3. Cite SPI references when available
4. If data is insufficient, state that clearly and suggest alternatives
5. For listing requests, format as a clean list
6. Be concise and professional
7. For county-specific queries, mention the county name clearly`;

  const userPrompt = `User Question: ${query}

Retrieved Data:
${contextText || 'No specific data found for this query.'}

Previous Conversation:
${historyContext || 'No previous conversation.'}

Provide a helpful response.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-4),
    { role: 'user', content: userPrompt },
  ];

  let response = null;
  let provider = 'groq';

  // Try Groq
  if (onChunk) {
    const streamResult = await streamGroq(messages, onChunk, { maxTokens, temperature });
    if (streamResult) {
      response = { content: 'Streamed response', provider: 'groq' };
    }
  } else {
    response = await callGroq(messages, { maxTokens, temperature });
  }

  // Fallback to HuggingFace
  if (!response) {
    console.log('🔄 Falling back to HuggingFace...');
    response = await callHuggingFace(messages, { maxTokens: Math.min(maxTokens, 500), temperature });
    provider = 'huggingface';
  }

  // Ultimate fallback – data summary
  if (!response) {
    console.log('⚠️ All LLMs failed, generating data summary');
    const fallbackResponse = generateFallbackResponse(query, retrievedData, classification);
    return {
      answer: fallbackResponse,
      data: retrievedData,
      classification,
      provider: 'fallback',
      citations: retrievedData.slice(0, 5).map(d => d.spi).filter(Boolean),
    };
  }

  // ============================================================
  // STEP 7: Return response
  // ============================================================
  return {
    answer: response.content,
    data: retrievedData,
    classification,
    provider,
    citations: retrievedData.slice(0, 5).map(d => d.spi).filter(Boolean),
    suggested_questions: generateSuggestedQuestions(query, classification, retrievedData),
  };
}

/**
 * Generate fallback response
 */
function generateFallbackResponse(query, data, classification) {
  if (data.length === 0) {
    if (classification.geography?.name) {
      return `I couldn't find specific data for "${classification.geography.name}". Try checking if the county name is spelled correctly, or try a different county.`;
    }
    return `I couldn't find specific data for "${query}". Try adjusting your search terms or selecting a specific county.`;
  }

  if (classification.intent === 'listing') {
    const indicators = data.slice(0, 15).map(ind => 
      `• ${ind.name} (${ind.unit || 'N/A'})`
    ).join('\n');
    return `Found ${data.length} indicators for ${classification.geography?.name || 'Kenya'}:\n\n${indicators}`;
  }

  const summary = data.slice(0, 5).map(ind => {
    const value = ind.value !== null && ind.value !== undefined 
      ? typeof ind.value === 'number' 
        ? ind.value.toLocaleString(undefined, { maximumFractionDigits: 2 })
        : ind.value
      : 'N/A'
    return `• ${ind.name}: ${value} ${ind.unit || ''} (${ind.year})`
  }).join('\n');

  return `Based on available data:\n\n${summary}\n\nI found ${data.length} indicators related to your query. Select one to view more details.`;
}

/**
 * Generate suggested questions
 */
function generateSuggestedQuestions(query, classification, data) {
  const suggestions = [];

  if (classification.geography?.name) {
    suggestions.push(`Show me GDP growth in ${classification.geography.name}`);
    suggestions.push(`What are the main sectors in ${classification.geography.name}?`);
  }

  if (data.length > 0 && data[0]?.name) {
    suggestions.push(`Show me the trend for "${data[0].name}"`);
  }

  suggestions.push('Compare counties');
  suggestions.push('Generate a report');

  return suggestions.slice(0, 4);
}

export default { runRAG };
