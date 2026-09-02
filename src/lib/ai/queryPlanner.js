/**
 * Query Planner & Intelligence Resolver
 */

export function resolveContextualQuery(query, conversationHistory = []) {
  if (!conversationHistory || conversationHistory.length === 0) {
    return { resolvedQuery: query, inheritedGeography: null, inheritedIntent: null };
  }

  // Look back at the last 3 user/assistant turns for contextual continuity
  const recentTurns = conversationHistory.slice(-3);
  let lastGeo = null;
  let lastIntent = null;

  for (const turn of recentTurns) {
    if (turn.classification?.geography?.name) {
      lastGeo = turn.classification.geography;
    }
    if (turn.classification?.intent) {
      lastIntent = turn.classification.intent;
    }
  }

  const isFollowUp = /^(what about|and in|how about|compare with|show me its|and its|why|how)/i.test(query.trim());

  let resolvedQuery = query;
  if (isFollowUp && lastGeo && !query.toLowerCase().includes(lastGeo.name.toLowerCase())) {
    resolvedQuery = `${query} in ${lastGeo.name}`;
  }

  return {
    resolvedQuery,
    inheritedGeography: lastGeo,
    inheritedIntent: lastIntent,
  };
}

export function calculateConfidenceScore(retrievedData = [], classification = {}) {
  if (!retrievedData || retrievedData.length === 0) return 0.1;

  let score = 0.5;

  // Has valid numeric values
  const hasValidValues = retrievedData.some(d => d.value !== null && d.value !== undefined);
  if (hasValidValues) score += 0.2;

  // Matched target geography
  if (classification.geography?.name) {
    const geoMatch = retrievedData.some(d => 
      (d.county_name && d.county_name.toLowerCase() === classification.geography.name.toLowerCase())
    );
    if (geoMatch) score += 0.15;
  } else {
    score += 0.1;
  }

  // Multiple years (trend capability)
  const uniqueYears = new Set(retrievedData.map(d => d.year).filter(Boolean));
  if (uniqueYears.size >= 2) score += 0.1;

  // Has verifiable SPI citation
  const hasSPI = retrievedData.some(d => Boolean(d.spi));
  if (hasSPI) score += 0.05;

  return Math.min(Number(score.toFixed(2)), 0.98);
}
