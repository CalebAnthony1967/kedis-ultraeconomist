/**
 * Data Retriever – Enhanced with geography and intent support
 */

import { supabase } from '@/lib/supabaseClient';
import { COUNTY_MAP } from './classifier';

/**
 * Retrieve data based on classified query
 */
export async function retrieveData(query, context = {}, limit = 20) {
  const { entities, geography, time_range, intent, search_terms } = context;
  
  let supabaseQuery = supabase
    .from('indicators')
    .select('*')
    .limit(limit);

  // ============================================================
  // 1. Apply geography filter
  // ============================================================
  if (geography?.type === 'county' && geography.code) {
    supabaseQuery = supabaseQuery.eq('county_code', geography.code);
  } else if (geography?.type === 'county' && geography.name) {
    // Try by county_name as well
    const countyName = geography.name.charAt(0).toUpperCase() + geography.name.slice(1);
    supabaseQuery = supabaseQuery.or(`county_name.ilike.%${countyName}%,county_code.ilike.%${geography.code}%`);
  }

  // ============================================================
  // 2. Apply time range filter
  // ============================================================
  if (time_range?.start) {
    supabaseQuery = supabaseQuery.gte('year', time_range.start);
  }
  if (time_range?.end) {
    supabaseQuery = supabaseQuery.lte('year', time_range.end);
  }

  // ============================================================
  // 3. Apply pillar filter
  // ============================================================
  if (entities?.pillars && entities.pillars.length > 0) {
    supabaseQuery = supabaseQuery.in('pillar', entities.pillars);
  }

  // ============================================================
  // 4. Build search terms for full-text search
  // ============================================================
  let searchTerms = [];
  
  // For listing intent, search broadly
  if (intent === 'listing') {
    // Don't restrict too much
    if (geography?.name) {
      searchTerms.push(geography.name);
    }
  } else {
    // Use extracted search terms
    searchTerms = search_terms || query.split(/\s+/).filter(w => w.length > 2);
  }

  // ============================================================
  // 5. Apply search conditions
  // ============================================================
  if (searchTerms.length > 0) {
    const conditions = searchTerms.map(term => 
      `search_text.ilike.%${term}%`
    ).join(',');
    supabaseQuery = supabaseQuery.or(conditions);
  }

  // ============================================================
  // 6. Execute query
  // ============================================================
  const { data, error } = await supabaseQuery;

  if (error) {
    console.error('Retrieval error:', error);
    return [];
  }

  // ============================================================
  // 7. Fallback: if no results, try broader search
  // ============================================================
  if (!data || data.length === 0) {
    console.log('No results, trying broader search...');
    
    let fallbackQuery = supabase
      .from('indicators')
      .select('*')
      .limit(limit);

    if (geography?.code) {
      fallbackQuery = fallbackQuery.eq('county_code', geography.code);
    } else if (geography?.name) {
      const countyName = geography.name.charAt(0).toUpperCase() + geography.name.slice(1);
      fallbackQuery = fallbackQuery.or(`county_name.ilike.%${countyName}%`);
    }

    const { data: fallbackData, error: fallbackError } = await fallbackQuery;
    if (!fallbackError && fallbackData && fallbackData.length > 0) {
      return fallbackData;
    }
  }

  return data || [];
}

/**
 * Get all available indicators for a county
 */
export async function getIndicatorsForCounty(countyCode) {
  const { data, error } = await supabase
    .from('indicators')
    .select('id, name, unit, year, value, source_mcda, entity_level')
    .eq('county_code', countyCode)
    .limit(100);

  if (error) {
    console.error('Error fetching county indicators:', error);
    return [];
  }

  return data || [];
}

/**
 * Get distinct indicators (unique by name) for a geography
 */
export async function getDistinctIndicators(geography) {
  let query = supabase
    .from('indicators')
    .select('id, name, unit, sector, pillar, source_mcda, entity_level')
    .limit(200);

  if (geography?.type === 'county' && geography.code) {
    query = query.eq('county_code', geography.code);
  } else if (geography?.type === 'county' && geography.name) {
    const countyName = geography.name.charAt(0).toUpperCase() + geography.name.slice(1);
    query = query.ilike('county_name', `%${countyName}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching distinct indicators:', error);
    return [];
  }

  // Deduplicate by name
  const unique = {};
  for (const item of data) {
    if (!unique[item.name]) {
      unique[item.name] = item;
    }
  }

  return Object.values(unique);
}

export default {
  retrieveData,
  getIndicatorsForCounty,
  getDistinctIndicators,
};
