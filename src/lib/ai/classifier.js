/**
 * Query Classifier – Determine intent and extract entities
 */

import { callGroq } from './providers/groq';
import { callHuggingFace } from './providers/huggingface';

/**
 * Classify user query using LLM
 */
export async function classifyQuery(query, history = []) {
  const systemPrompt = `You are a query classifier for a data exploration system. 
Analyze the user query and return a JSON object with the following structure:
{
  "intent": "fact|trend|comparison|report|forecast|analysis",
  "entities": {
    "indicators": ["GDP", "inflation"],
    "counties": ["Nairobi", "Mombasa"],
    "years": [2020, 2024],
    "pillars": ["Economic", "Social"],
    "domains": ["Macroeconomic", "Fiscal"]
  },
  "time_range": {"start": 2020, "end": 2024},
  "geography": "national|county|ward",
  "output_format": "chat|brief|report|chart"
}

Return ONLY valid JSON.`;

  const userPrompt = `Query: ${query}\n\nContext: ${history.join('\n') || 'No previous context'}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  let result = await callGroq(messages, { maxTokens: 300, temperature: 0.3 });
  
  if (!result) {
    result = await callHuggingFace(messages, { maxTokens: 300, temperature: 0.3 });
  }

  if (!result) {
    // Fallback to basic extraction
    return fallbackClassifier(query);
  }

  try {
    // Extract JSON from response
    const content = result.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return fallbackClassifier(query);
  } catch (error) {
    console.warn('JSON parsing failed, using fallback:', error);
    return fallbackClassifier(query);
  }
}

/**
 * Fallback classifier (no LLM)
 */
function fallbackClassifier(query) {
  const lower = query.toLowerCase();
  const result = {
    intent: 'fact',
    entities: { indicators: [], counties: [], years: [], pillars: [], domains: [] },
    time_range: { start: null, end: null },
    geography: 'national',
    output_format: 'chat',
  };

  // Extract years
  const yearMatches = query.match(/\b(20\d{2})\b/g);
  if (yearMatches) {
    const years = yearMatches.map(Number).sort();
    result.time_range.start = years[0];
    result.time_range.end = years[years.length - 1];
    result.entities.years = years;
  }

  // Extract counties
  const counties = ['nairobi', 'mombasa', 'kisumu', 'nakuru', 'kiambu', 'meru', 'kilifi'];
  for (const county of counties) {
    if (lower.includes(county)) {
      result.entities.counties.push(county.charAt(0).toUpperCase() + county.slice(1));
      result.geography = 'county';
    }
  }

  // Extract indicators
  const indicators = ['gdp', 'growth', 'inflation', 'debt', 'revenue', 'health', 'education'];
  for (const ind of indicators) {
    if (lower.includes(ind)) {
      result.entities.indicators.push(ind.toUpperCase());
    }
  }

  // Detect intent
  if (lower.includes('compare') || lower.includes('vs') || lower.includes('versus')) {
    result.intent = 'comparison';
  } else if (lower.includes('trend') || lower.includes('over time')) {
    result.intent = 'trend';
  } else if (lower.includes('report') || lower.includes('brief')) {
    result.intent = 'report';
    result.output_format = 'report';
  } else if (lower.includes('chart') || lower.includes('graph') || lower.includes('visualize')) {
    result.intent = 'analysis';
    result.output_format = 'chart';
  }

  return result;
}

export default { classifyQuery };
