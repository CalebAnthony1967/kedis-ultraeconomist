/**
 * ============================================================================
 * KEDIS Data Explorer – API Functions
 * ============================================================================
 * All Supabase RPC calls for the Data Explorer
 * ============================================================================
 */

import { supabase } from './supabaseClient';

/**
 * Search indicators with filters
 */
export async function searchExplorer({
  query = '',
  domainIds = [],
  subdomainIds = [],
  pillars = [],
  countyCodes = [],
  sourceMcdas = [],
  yearStart = null,
  yearEnd = null,
  entityLevels = [],
  sortBy = 'relevance',
  sortOrder = 'desc',
  limit = 20,
  offset = 0,
} = {}) {
  const { data, error } = await supabase.rpc('search_explorer', {
    p_query: query || null,
    p_domain_ids: domainIds.length > 0 ? domainIds : null,
    p_subdomain_ids: subdomainIds.length > 0 ? subdomainIds : null,
    p_pillars: pillars.length > 0 ? pillars : null,
    p_county_codes: countyCodes.length > 0 ? countyCodes : null,
    p_source_mcdas: sourceMcdas.length > 0 ? sourceMcdas : null,
    p_year_start: yearStart,
    p_year_end: yearEnd,
    p_entity_level: entityLevels.length > 0 ? entityLevels : null,
    p_sort_by: sortBy,
    p_sort_order: sortOrder,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    console.error('Search Explorer Error:', error);
    throw error;
  }

  // Extract total_count from first row
  const totalCount = data && data.length > 0 ? data[0].total_count : 0;
  return { data: data || [], totalCount };
}

/**
 * Get domain tree with subdomains and counts
 */
export async function getDomainTree() {
  const { data, error } = await supabase.rpc('get_domain_tree');
  if (error) {
    console.error('Get Domain Tree Error:', error);
    throw error;
  }
  return data || [];
}

/**
 * Get counties with indicator counts
 */
export async function getCountiesWithCounts() {
  const { data, error } = await supabase.rpc('get_counties_with_counts');
  if (error) {
    console.error('Get Counties Error:', error);
    throw error;
  }
  return data || [];
}

/**
 * Get subcounties for a county
 */
export async function getSubcountiesForCounty(countyCode) {
  const { data, error } = await supabase.rpc('get_subcounties_for_county', {
    p_county_code: countyCode,
  });
  if (error) {
    console.error('Get Subcounties Error:', error);
    throw error;
  }
  return data || [];
}

/**
 * Get wards for a subcounty
 */
export async function getWardsForSubcounty(subcountyCode) {
  const { data, error } = await supabase.rpc('get_wards_for_subcounty', {
    p_subcounty_code: subcountyCode,
  });
  if (error) {
    console.error('Get Wards Error:', error);
    throw error;
  }
  return data || [];
}

/**
 * Get indicator time series
 */
export async function getIndicatorSeries(indicatorId, countyCode = null) {
  const { data, error } = await supabase.rpc('get_indicator_series', {
    p_indicator_id: indicatorId,
    p_county_code: countyCode,
  });
  if (error) {
    console.error('Get Indicator Series Error:', error);
    throw error;
  }
  return data || [];
}

/**
 * Get domain options (for filters)
 */
export async function getDomainOptions() {
  const { data, error } = await supabase.rpc('get_domain_options');
  if (error) {
    console.error('Get Domain Options Error:', error);
    throw error;
  }
  return data || [];
}

/**
 * Get year options (for filters)
 */
export async function getYearOptions() {
  const { data, error } = await supabase.rpc('get_year_options');
  if (error) {
    console.error('Get Year Options Error:', error);
    throw error;
  }
  return data || [];
}

/**
 * Get source options (for filters)
 */
export async function getSourceOptions() {
  const { data, error } = await supabase.rpc('get_source_options');
  if (error) {
    console.error('Get Source Options Error:', error);
    throw error;
  }
  return data || [];
}

/**
 * Get pillar options (for filters)
 */
export async function getPillarOptions() {
  const { data, error } = await supabase.rpc('get_pillar_options');
  if (error) {
    console.error('Get Pillar Options Error:', error);
    throw error;
  }
  return data || [];
}

/**
 * Get indicators for a subdomain
 */
export async function getIndicatorsForSubdomain({
  subdomainId,
  entityLevel = null,
  countyCode = null,
  limit = 50,
  offset = 0,
}) {
  const { data, error } = await supabase.rpc('get_indicators_for_subdomain', {
    p_subdomain_id: subdomainId,
    p_entity_level: entityLevel,
    p_county_code: countyCode,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) {
    console.error('Get Indicators for Subdomain Error:', error);
    throw error;
  }
  return data || [];
}

/**
 * Search by embedding (semantic search)
 */
export async function searchByEmbedding(embedding, threshold = 0.7, limit = 20) {
  const { data, error } = await supabase.rpc('search_indicators_by_embedding', {
    query_embedding: embedding,
    match_threshold: threshold,
    match_count: limit,
  });
  if (error) {
    console.error('Search by Embedding Error:', error);
    throw error;
  }
  return data || [];
}

/**
 * Get all filter options at once (for faster loading)
 */
export async function getAllFilterOptions() {
  const [domains, years, sources, pillars, counties] = await Promise.all([
    getDomainOptions(),
    getYearOptions(),
    getSourceOptions(),
    getPillarOptions(),
    getCountiesWithCounts(),
  ]);

  return {
    domains,
    years,
    sources,
    pillars,
    counties,
  };
}
