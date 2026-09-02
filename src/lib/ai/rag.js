/**
 * RAG Pipeline – Complete Retrieval-Augmented Generation
 */

import { classifyQuery } from './classifier';
import { retrieveData, getIndicatorTimeSeries, getRelatedIndicators } from './retriever';
import { callGroq, streamGroq } from './providers/groq';
import { callHuggingFace } from './providers/huggingface';
import { buildConversationContext, extractContextEntities } from './memory';
import { supabase } from '@/lib/supabaseClient';

/**
 * Main RAG pipeline
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

  // Step 1: Classify query
  const classification = await classifyQuery(query, conversationHistory);
  console.log('📋 Classification:', classification);

  // Step 2: Build context from conversation history
  const historyContext = buildConversationContext(conversationHistory);
  const entities = extractContextEntities(conversationHistory);
  
  // Combine entities from classification and history
  const combinedEntities = {
    indicators: [...(classification.entities?.indicators || []), ...(entities.indicators || [])],
    counties: [...(classification.entities?.counties || []), ...(entities.counties || [])],
    years: [...(classification.entities?.years || []), ...(entities.years || [])],
  };

  // Step 3: Retrieve data
  const filters = {
    ...filterContext,
    countyCodes: combinedEntities.counties,
    entityLevels: classification.geography === 'county' ? ['County'] : ['National', 'County'],
    yearStart: classification.time_range?.start,
    yearEnd: classification.time_range?.end,
  };

  const retrievedData = await retrieveData(query, { entities: combinedEntities, filters });
  console.log(`📊 Retrieved ${retrievedData.length} indicators`);

  // Step 4: Build context for LLM
  const dataContext = retrievedData.slice(0, 10).map(ind => {
    return `- ${ind.name} (${ind.year}): ${ind.value} ${ind.unit || ''} | Source: ${ind.source_mcda || 'Unknown'}`;
  }).join('\n');

  // Step 5: Generate response with Groq (or fallback)
  const systemPrompt = `You are AlphaEconomist, Kenya's leading economic policy assistant.
You help users explore economic data and provide insights.

Key principles:
1. Always cite data sources when referencing specific figures
2. If data is insufficient, state that clearly
3. Provide analysis, not just raw numbers
4. Suggest follow-up questions when appropriate
5. Use the conversation history to maintain context

Current context:
- Query intent: ${classification.intent}
- Geography: ${classification.geography}
- Time range: ${classification.time_range?.start} - ${classification.time_range?.end}
- Entities: ${JSON.stringify(combinedEntities)}`;

  const userPrompt = `Question: ${query}

Retrieved data:
${dataContext || 'No specific data found for this query.'}

Conversation history:
${historyContext || 'No previous conversation.'}

Please provide a helpful, data-driven response.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-6), // Include recent history
    { role: 'user', content: userPrompt },
  ];

  let response = null;
  let provider = 'groq';

  // Try Groq first with streaming
  if (onChunk) {
    const streamResult = await streamGroq(messages, onChunk, {
      maxTokens,
      temperature,
    });
    if (streamResult) {
      response = { content: 'Streamed response', provider: 'groq' };
    }
  } else {
    response = await callGroq(messages, { maxTokens, temperature });
  }

  // Fallback to HuggingFace if Groq fails
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

  // Step 6: Save conversation to Supabase
  if (conversationId) {
    try {
      await supabase
        .from('copilot_conversations')
        .update({
          messages: [
            ...conversationHistory,
            { role: 'user', content: query },
            { role: 'assistant', content: response.content },
          ],
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);
    } catch (e) {
      console.warn('Failed to save conversation:', e);
    }
  }

  // Step 7: Return complete response
  return {
    answer: response.content,
    data: retrievedData,
    classification,
    provider,
    citations: retrievedData.slice(0, 5).map(d => d.spi).filter(Boolean),
    suggestedQuestions: generateSuggestedQuestions(query, classification, retrievedData),
  };
}

/**
 * Generate fallback response when LLM is unavailable
 */
function generateFallbackResponse(query, data, classification) {
  if (data.length === 0) {
    return `I couldn't find specific data for "${query}". Try adjusting your search terms or filters.`;
  }

  const summary = data.slice(0, 5).map(d => 
    `• ${d.name}: ${d.value} ${d.unit || ''} (${d.year})`
  ).join('\n');

  return `Based on available data:\n\n${summary}\n\nI found ${data.length} indicators related to your query. Please select one to view more details.`;
}

/**
 * Generate suggested follow-up questions
 */
function generateSuggestedQuestions(query, classification, data) {
  const suggestions = [];

  if (data.length > 0) {
    suggestions.push(`Show me the trend for ${data[0]?.name}`);
  }

  if (classification.entities?.counties?.length > 0) {
    suggestions.push(`Compare ${classification.entities.counties.join(' and ')}`);
  }

  suggestions.push('Show me related indicators');
  suggestions.push('Generate a report on these findings');

  return suggestions.slice(0, 4);
}

export default { runRAG };
