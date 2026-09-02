/**
 * Data Retriever – Fetch relevant data from Supabase
 */

import { supabase } from '@/lib/supabaseClient';

/**
 * Retrieve relevant indicators based on query context
 */
export async function retrieveData(query, context = {}, limit = 15) {
  const { entities, filters } = context;

  let supabaseQuery = supabase
    .from('indicators')
    .select('*')
    .limit(limit);

  // Apply filters from context
  if (filters?.countyCodes && filters.countyCodes.length > 0) {
    supabaseQuery = supabaseQuery.in('county_code', filters.countyCodes);
  }

  if (filters?.entityLevels && filters.entityLevels.length > 0) {
    supabaseQuery = supabaseQuery.in('entity_level', filters.entityLevels);
  }

  if (filters?.yearStart) {
    supabaseQuery = supabaseQuery.gte('year', filters.yearStart);
  }

  if (filters?.yearEnd) {
    supabaseQuery = supabaseQuery.lte('year', filters.yearEnd);
  }

  if (filters?.domains && filters.domains.length > 0) {
    supabaseQuery = supabaseQuery.in('domain', filters.domains);
  }

  // Search by indicator name or description
  if (query) {
    supabaseQuery = supabaseQuery.or(
      `search_text.ilike.%${query}%,name.ilike.%${query}%`
    );
  }

  const { data, error } = await supabaseQuery;
  if (error) {
    console.error('Retrieval error:', error);
    return [];
  }

  return data || [];
}

/**
 * Get indicator time series for a specific indicator
 */
export async function getIndicatorTimeSeries(indicatorId, countyCode = null) {
  let query = supabase
    .from('indicators')
    .select('year, value, unit, source_mcda, county_name')
    .eq('id', indicatorId)
    .order('year', { ascending: true });

  if (countyCode) {
    query = query.eq('county_code', countyCode);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Time series error:', error);
    return [];
  }

  return data || [];
}

/**
 * Get related indicators (semantic similarity)
 */
export async function getRelatedIndicators(indicatorId, limit = 5) {
  // Get the indicator first
  const { data: indicator, error } = await supabase
    .from('indicators')
    .select('name, sector, pillar')
    .eq('id', indicatorId)
    .single();

  if (error || !indicator) return [];

  // Find related by sector or pillar
  const { data, error: relatedError } = await supabase
    .from('indicators')
    .select('id, name, pillar, sector, unit')
    .or(`sector.ilike.%${indicator.sector}%,pillar.ilike.%${indicator.pillar}%`)
    .neq('id', indicatorId)
    .limit(limit);

  if (relatedError) return [];
  return data || [];
}

/**
 * Search by semantic embedding (if available)
 */
export async function semanticSearch(query, limit = 10) {
  // This would use pgvector if embeddings are stored
  // For now, fallback to full-text search
  return retrieveData(query, {}, limit);
}

export default {
  retrieveData,
  getIndicatorTimeSeries,
  getRelatedIndicators,
  semanticSearch,
};
