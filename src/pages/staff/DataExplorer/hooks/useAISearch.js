import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * AI Search Hook – Converts natural language to filters
 * Uses AlphaEconomist classification (via Supabase Edge Function or direct call)
 */
export function useAISearch() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [classification, setClassification] = useState(null);

  /**
   * Translate natural language query to filters
   */
  const translateQuery = useCallback(async (query) => {
    if (!query || query.trim().length === 0) return null;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Try to call the AlphaEconomist classification via Edge Function
      let result = await callAlphaEconomistClassify(query);
      
      // Fallback to local classification if edge function fails
      if (!result) {
        result = localClassification(query);
      }
      
      setClassification(result);
      return result;
    } catch (err) {
      setError(err.message);
      // Fallback: basic keyword extraction
      return localClassification(query);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    translateQuery,
    isProcessing,
    error,
    classification,
  };
}

/**
 * Call AlphaEconomist via Supabase Edge Function
 */
async function callAlphaEconomistClassify(query) {
  try {
    const { data, error } = await supabase.functions.invoke('alpha-economist-classify', {
      body: { query },
    });
    
    if (error) throw error;
    return data;
  } catch (e) {
    console.warn('AlphaEconomist classification failed:', e);
    return null;
  }
}

/**
 * Local fallback classification
 */
function localClassification(query) {
  const lower = query.toLowerCase();
  const result = {
    searchTerm: query,
    entities: [],
    geography: 'national',
    entityLevel: ['National', 'County'],
    yearStart: null,
    yearEnd: null,
    indicators: [],
    pillars: [],
    countyCodes: [],
    domains: [],
  };

  // Extract geography (counties)
  const counties = [
    'nairobi', 'mombasa', 'kisumu', 'nakuru', 'kiambu', 
    'meru', 'kilifi', 'kwale', 'tana river', 'lamu',
    'taita taveta', 'garissa', 'wajir', 'mandera', 'marsabit',
    'isiolo', 'meru', 'tharaka nithi', 'embu', 'kitui',
    'machakos', 'makueni', 'nyandarua', 'nyeri', 'kirinyaga',
    'muranga', 'kiambu', 'turkana', 'west pokot', 'samburu',
    'trans nzoia', 'uasin gishu', 'elgeyo marakwet', 'nandi',
    'baringo', 'laikipia', 'nakuru', 'narok', 'kajiado',
    'kericho', 'bomet', 'kakamega', 'vihiga', 'bungoma',
    'busia', 'siaya', 'kisumu', 'homa bay', 'migori',
    'kisii', 'nyamira', 'nairobi city'
  ];
  
  for (const county of counties) {
    if (lower.includes(county)) {
      result.geography = county;
      result.entityLevel = ['County'];
      result.countyCodes = [county];
      break;
    }
  }

  // Extract years
  const yearMatch = query.match(/\b(20\d{2})\b/g);
  if (yearMatch) {
    const years = yearMatch.map(Number).sort();
    result.yearStart = years[0];
    result.yearEnd = years[years.length - 1];
  }

  // Extract indicators
  const indicators = [
    'gdp', 'growth', 'inflation', 'debt', 'revenue', 
    'health', 'education', 'poverty', 'employment', 'trade',
    'investment', 'consumption', 'saving', 'tax', 'expenditure',
    'agriculture', 'manufacturing', 'services', 'construction',
    'tourism', 'transport', 'energy', 'water', 'sanitation'
  ];
  
  for (const ind of indicators) {
    if (lower.includes(ind)) {
      result.indicators.push(ind);
    }
  }

  // Extract pillars
  const pillars = ['economic', 'social', 'governance', 'environmental', 'political'];
  for (const pillar of pillars) {
    if (lower.includes(pillar)) {
      result.pillars.push(pillar.charAt(0).toUpperCase() + pillar.slice(1));
    }
  }

  // Extract SDG
  if (lower.includes('sdg') || lower.includes('sustainable development')) {
    result.domains.push('SDG');
  }

  // Infer intent
  if (lower.includes('compare') || lower.includes('vs') || lower.includes('versus')) {
    result.intent = 'comparison';
  } else if (lower.includes('trend') || lower.includes('over time')) {
    result.intent = 'trend';
  } else if (lower.includes('report') || lower.includes('brief')) {
    result.intent = 'report';
  } else if (lower.includes('forecast') || lower.includes('predict')) {
    result.intent = 'forecast';
  } else {
    result.intent = 'fact';
  }

  return result;
}

export default useAISearch;
