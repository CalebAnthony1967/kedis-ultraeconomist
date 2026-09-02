/**
 * Query Classifier – Extract intent, entities, and geography
 */

import { callGroq } from './providers/groq';
import { callHuggingFace } from './providers/huggingface';

/**
 * County mapping for Kenya (47 counties)
 */
const COUNTY_MAP = {
  'nairobi': '047',
  'mombasa': '001',
  'kwale': '002',
  'kilifi': '003',
  'tana river': '004',
  'lamu': '005',
  'taita taveta': '006',
  'garissa': '007',
  'wajir': '008',
  'mandera': '009',
  'marsabit': '010',
  'isiolo': '011',
  'meru': '012',
  'tharaka nithi': '013',
  'embu': '014',
  'kitui': '015',
  'machakos': '016',
  'makueni': '017',
  'nyandarua': '018',
  'nyeri': '019',
  'kirinyaga': '020',
  'muranga': '021',
  'kiambu': '022',
  'turkana': '023',
  'west pokot': '024',
  'samburu': '025',
  'trans nzoia': '026',
  'uasin gishu': '027',
  'elgeyo marakwet': '028',
  'nandi': '029',
  'baringo': '030',
  'laikipia': '031',
  'nakuru': '032',
  'narok': '033',
  'kajiado': '034',
  'kericho': '035',
  'bomet': '036',
  'kakamega': '037',
  'vihiga': '038',
  'bungoma': '039',
  'busia': '040',
  'siaya': '041',
  'kisumu': '042',
  'homa bay': '043',
  'migori': '044',
  'kisii': '045',
  'nyamira': '046',
  'nairobi city': '047',
};

/**
 * Main classification function with entity extraction
 */
export async function classifyQuery(query, history = []) {
  const lower = query.toLowerCase();
  
  // Step 1: Extract geography
  const geography = extractGeography(lower);
  
  // Step 2: Extract time range
  const timeRange = extractTimeRange(query);
  
  // Step 3: Extract indicators
  const indicators = extractIndicators(lower);
  
  // Step 4: Detect intent
  const intent = detectIntent(lower);
  
  // Step 5: Detect output format
  const outputFormat = detectOutputFormat(lower);
  
  return {
    intent,
    entities: {
      indicators,
      counties: geography.counties,
      years: timeRange.years,
      pillars: extractPillars(lower),
    },
    geography: geography.type,
    geography_code: geography.code,
    geography_name: geography.name,
    time_range: timeRange,
    output_format: outputFormat,
    confidence: geography.confidence || 0.8,
    // Store original query for fallback
    search_terms: extractSearchTerms(query, geography, indicators),
  };
}

/**
 * Extract geography from query
 */
function extractGeography(text) {
  const result = {
    type: 'national',
    code: null,
    name: null,
    counties: [],
    confidence: 0.5,
  };

  // Check for county mentions
  for (const [countyName, code] of Object.entries(COUNTY_MAP)) {
    if (text.includes(countyName)) {
      result.counties.push(countyName.charAt(0).toUpperCase() + countyName.slice(1));
      result.type = 'county';
      result.code = code;
      result.name = countyName;
      result.confidence = 0.9;
    }
  }

  // Check for ward/subcounty (future enhancement)
  if (text.includes('ward') || text.includes('subcounty')) {
    result.type = 'ward';
    result.confidence = 0.7;
  }

  return result;
}

/**
 * Extract time range from query
 */
function extractTimeRange(query) {
  const years = [];
  const yearMatches = query.match(/\b(19\d{2}|20\d{2})\b/g);
  if (yearMatches) {
    years.push(...yearMatches.map(Number));
  }
  
  // Look for ranges like "2018-2024"
  const rangeMatch = query.match(/\b(19\d{2}|20\d{2})\s*[-–to]\s*(19\d{2}|20\d{2})\b/i);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1]);
    const end = parseInt(rangeMatch[2]);
    return { start, end, years: [start, end] };
  }
  
  if (years.length === 1) {
    return { start: years[0], end: years[0], years };
  }
  
  if (years.length > 1) {
    return { start: Math.min(...years), end: Math.max(...years), years };
  }
  
  return { start: null, end: null, years: [] };
}

/**
 * Extract indicator names from query
 */
function extractIndicators(text) {
  const indicators = [];
  const indicatorKeywords = [
    'gdp', 'growth', 'inflation', 'debt', 'revenue', 'tax', 
    'health', 'education', 'poverty', 'employment', 'trade',
    'investment', 'consumption', 'agriculture', 'manufacturing',
    'services', 'construction', 'tourism', 'transport', 'energy',
    'water', 'sanitation', 'population', 'mortality', 'literacy',
    'enrollment', 'fertility', 'hiv', 'malaria', 'nutrition',
  ];
  
  for (const keyword of indicatorKeywords) {
    if (text.includes(keyword)) {
      indicators.push(keyword);
    }
  }
  
  return indicators;
}

/**
 * Extract pillars from query
 */
function extractPillars(text) {
  const pillars = [];
  const pillarMap = {
    'economic': 'Economic',
    'social': 'Social',
    'governance': 'Governance',
    'environmental': 'Environmental',
    'political': 'Political',
  };
  
  for (const [key, value] of Object.entries(pillarMap)) {
    if (text.includes(key)) {
      pillars.push(value);
    }
  }
  
  return pillars;
}

/**
 * Detect intent from query
 */
function detectIntent(text) {
  if (text.includes('compare') || text.includes('vs') || text.includes('versus') || text.includes('between')) {
    return 'comparison';
  }
  if (text.includes('trend') || text.includes('over time') || text.includes('change') || text.includes('increase') || text.includes('decrease')) {
    return 'trend';
  }
  if (text.includes('report') || text.includes('brief') || text.includes('summary') || text.includes('overview')) {
    return 'report';
  }
  if (text.includes('chart') || text.includes('graph') || text.includes('visualize') || text.includes('show me')) {
    return 'visualization';
  }
  if (text.includes('list') || text.includes('what are') || text.includes('all') || text.includes('available')) {
    return 'listing';
  }
  if (text.includes('forecast') || text.includes('predict') || text.includes('projection')) {
    return 'forecast';
  }
  if (text.includes('what') || text.includes('how') || text.includes('why') || text.includes('when')) {
    return 'question';
  }
  return 'fact';
}

/**
 * Detect output format
 */
function detectOutputFormat(text) {
  if (text.includes('chart') || text.includes('graph') || text.includes('visualize')) {
    return 'chart';
  }
  if (text.includes('table') || text.includes('list')) {
    return 'table';
  }
  if (text.includes('report') || text.includes('brief') || text.includes('summary')) {
    return 'report';
  }
  return 'chat';
}

/**
 * Extract search terms for retrieval
 */
function extractSearchTerms(query, geography, indicators) {
  const terms = [];
  
  // Remove common stop words
  const stopWords = ['what', 'are', 'is', 'the', 'of', 'to', 'for', 'with', 'on', 'at', 'from', 'by', 'in', 'an', 'a'];
  const words = query.split(/\s+/);
  
  for (const word of words) {
    const lower = word.toLowerCase();
    if (!stopWords.includes(lower) && lower.length > 2) {
      terms.push(lower);
    }
  }
  
  // Add geography if present
  if (geography.name) {
    terms.push(geography.name);
  }
  
  // Add indicators
  for (const indicator of indicators) {
    terms.push(indicator);
  }
  
  return terms.slice(0, 10);
}

export default { classifyQuery, COUNTY_MAP };
