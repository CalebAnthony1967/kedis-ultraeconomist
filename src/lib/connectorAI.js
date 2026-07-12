/**
 * KEDIS UltraEconomist — Connector AI Agent
 * Uses Hugging Face free Inference API to monitor connector health,
 * detect new data releases, and provide automated recommendations.
 */

const HF_TOKEN = import.meta.env.VITE_HF_TOKEN;
const HF_API_URL = 'https://router.huggingface.co/v1/chat/completions';
const HF_MODEL = 'mistralai/Mistral-7B-Instruct-v0.3';
const FALLBACK_MODELS = ['HuggingFaceH4/zephyr-7b-beta'];

// Known data release patterns for each connector type
const RELEASE_PATTERNS = {
  KNBS_SDMX: { frequency: 'monthly', description: 'KNBS Statistical Dissemination — monthly bulletins, quarterly Leading Economic Indicators' },
  CBK_Bulletin: { frequency: 'weekly', description: 'Central Bank of Kenya — weekly bulletins, daily exchange rates' },
  Treasury_BPS: { frequency: 'quarterly', description: 'National Treasury — Budget Policy Statement (annual), quarterly budget review' },
  SurveyCTO: { frequency: 'irregular', description: 'SurveyCTO field data — uploaded as surveys complete' },
  KOBO_Toolbox: { frequency: 'irregular', description: 'KOBO Toolbox field data — uploaded as forms are submitted' },
  Satellite_NightLights: { frequency: 'daily', description: 'NASA/NOAA VIIRS — nightly satellite imagery' },
  Mobile_Money: { frequency: 'daily', description: 'Safaricom M-Pesa — daily transaction aggregates' },
};

async function callHFModel(model, systemPrompt, userPrompt) {
  const response = await fetch(HF_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${HF_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: 1200,
      top_p: 0.9,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`HF API ${response.status}: ${errText.substring(0, 200)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Analyze connector health and provide recommendations
 * @param {Array} connectors - Array of connector objects from Supabase
 * @returns {Object} { summary, recommendations, anomalies, overallHealth }
 */
export async function analyzeConnectorHealth(connectors) {
  if (!HF_TOKEN) {
    throw new Error('Hugging Face token not configured. Set VITE_HF_TOKEN.');
  }

  if (!connectors || connectors.length === 0) {
    return {
      summary: 'No connectors configured. Add data source connectors to begin CDC pipeline monitoring.',
      recommendations: [],
      anomalies: [],
      overallHealth: 'unknown',
    };
  }

  // Build connector data summary for the AI
  const now = new Date();
  const connectorData = connectors.map(c => {
    const lastSync = c.last_sync ? new Date(c.last_sync) : null;
    const hoursSinceSync = lastSync ? Math.floor((now - lastSync) / 3600000) : null;
    const pattern = RELEASE_PATTERNS[c.type] || {};
    return {
      name: c.name,
      type: c.type,
      status: c.status,
      health_score: c.health_score,
      records_synced: c.records_synced,
      last_sync: c.last_sync,
      hours_since_sync: hoursSinceSync,
      source_url: c.source_url,
      auto_sync: c.auto_sync,
      poll_interval: c.poll_interval_minutes,
      last_error: c.last_error,
      expected_frequency: pattern.frequency,
      release_description: pattern.description,
    };
  });

  const systemPrompt = `You are the KEDIS CDC Pipeline AI Agent, an autonomous monitoring system for Kenya's sovereign data connectors. You monitor data pipelines from KNBS, CBK, Treasury, KRA, and field survey platforms.

Your job:
1. Analyze the health of each data connector
2. Detect anomalies (stale data, error states, degraded health)
3. Identify connectors that likely have new data available based on their release patterns
4. Provide actionable recommendations

Respond in valid JSON only with this structure:
{
  "summary": "2-3 sentence overview of pipeline health",
  "overall_health": "healthy" | "degraded" | "critical",
  "anomalies": [{"connector": "name", "issue": "description", "severity": "warning" | "critical"}],
  "recommendations": [{"connector": "name", "action": "sync" | "pause" | "fix_url" | "investigate", "reason": "explanation"}],
  "new_data_available": [{"connector": "name", "confidence": "high" | "medium" | "low", "reason": "explanation"}]
}`;

  const userPrompt = `Analyze these ${connectorData.length} data connectors:\n\n${JSON.stringify(connectorData, null, 2)}`;

  let rawResponse;
  try {
    rawResponse = await callHFModel(HF_MODEL, systemPrompt, userPrompt);
  } catch (primaryError) {
    for (const fb of FALLBACK_MODELS) {
      try {
        rawResponse = await callHFModel(fb, systemPrompt, userPrompt);
        break;
      } catch (e) { /* try next */ }
    }
    if (!rawResponse) throw primaryError;
  }

  // Parse JSON response
  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawResponse);
    return parsed;
  } catch (e) {
    return {
      summary: rawResponse.substring(0, 500),
      overall_health: 'unknown',
      anomalies: [],
      recommendations: [],
      new_data_available: [],
    };
  }
}

/**
 * Check if a connector's source URL is reachable (HEAD request)
 * Returns { reachable, lastModified, contentType, error }
 */
export async function checkSourceReachability(sourceUrl) {
  if (!sourceUrl) return { reachable: false, error: 'No source URL configured' };

  try {
    const response = await fetch(sourceUrl, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: AbortSignal.timeout(10000),
    });
    return {
      reachable: true,
      lastModified: response.headers.get('last-modified'),
      contentType: response.headers.get('content-type'),
    };
  } catch (e) {
    return {
      reachable: false,
      error: e.message || 'Could not reach source URL (may be CORS-restricted)',
    };
  }
}

/**
 * Detect connectors that likely have new data based on release patterns
 */
export function detectStaleConnectors(connectors) {
  const now = new Date();
  const stale = [];

  for (const conn of connectors) {
    if (conn.status !== 'active') continue;
    const pattern = RELEASE_PATTERNS[conn.type];
    if (!pattern) continue;

    const lastSync = conn.last_sync ? new Date(conn.last_sync) : null;
    if (!lastSync) {
      stale.push({ connector: conn, reason: 'Never synced', severity: 'warning' });
      continue;
    }

    const hoursSinceSync = (now - lastSync) / 3600000;
    const intervalHours = (conn.poll_interval_minutes || 60) / 60;

    if (hoursSinceSync > intervalHours * 2) {
      stale.push({
        connector: conn,
        reason: `Last sync ${Math.floor(hoursSinceSync)}h ago (expected every ${Math.floor(intervalHours)}h)`,
        severity: hoursSinceSync > intervalHours * 4 ? 'critical' : 'warning',
      });
    }
  }

  return stale;
}