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
      // Try to call the AlphaEconomist classification
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
  };

  // Extract geography
  const counties = ['nairobi', 'mombasa', 'kisumu', 'nakuru', 'kiambu', 'meru', 'kilifi'];
  for (const county of counties) {
    if (lower.includes(county)) {
      result.geography = county;
      result.entityLevel = ['County'];
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
  const indicators = ['gdp', 'growth', 'inflation', 'debt', 'revenue', 'health', 'education', 'poverty'];
  for (const ind of indicators) {
    if (lower.includes(ind)) {
      result.indicators.push(ind);
    }
  }

  return result;
}
