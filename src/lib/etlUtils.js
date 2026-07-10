
/**
 * ============================================================================
 * KEDIS UltraEconomist — ETL Utilities
 * ============================================================================
 * File parsing, silo-healing, data contract validation, SHA-256 hashing,
 * header auto-mapping, FAIR scoring, and session persistence.
 * ============================================================================
 */

import * as XLSX from 'xlsx';

// ---------------------------------------------------------------------------
// Global Schema — maps directly to the `indicators` Supabase table
// ---------------------------------------------------------------------------

export const GLOBAL_SCHEMA_FIELDS = [
  { key: 'indicator_id', label: 'Indicator ID', type: 'string', required: true },
  { key: 'name', label: 'Indicator Name', type: 'string', required: true },
  { key: 'pillar', label: 'Pillar', type: 'enum', enum: ['Economic', 'Social', 'Governance', 'Environmental', 'Political'], required: true },
  { key: 'sector', label: 'Sector', type: 'string', required: true },
  { key: 'sub_sector', label: 'Sub-Sector', type: 'string', required: false },
  { key: 'department', label: 'Department', type: 'string', required: false },
  { key: 'location_code', label: 'Location Code', type: 'string', required: false },
  { key: 'year', label: 'Year', type: 'integer', required: true, min: 1963, max: 2063 },
  { key: 'value', label: 'Value', type: 'number', required: true },
  { key: 'unit', label: 'Unit', type: 'string', required: true },
  { key: 'source_mcda', label: 'Source MCDA', type: 'string', required: true },
  { key: 'link_to_sdg', label: 'SDG Link', type: 'string', required: false },
];

export const PILLAR_VALUES = ['Economic', 'Social', 'Governance', 'Environmental', 'Political'];

// Header aliases for auto-mapping (normalized: lowercase, no non-alphanumeric)
const HEADER_ALIASES = {
  indicator_id: ['indicatorid', 'indcode', 'indid', 'indicatorcode', 'code', 'indicatorcode', 'indid'],
  name: ['name', 'indicatorname', 'indicator', 'variable', 'metric', 'description', 'label', 'item'],
  pillar: ['pillar', 'pillarname', 'category', 'theme', 'dimension', 'type'],
  sector: ['sector', 'sectorname', 'area', 'domain', 'field'],
  sub_sector: ['subsector', 'subsectorname', 'subarea', 'subcategory'],
  department: ['department', 'dept', 'ministry', 'agency', 'org', 'organization'],
  location_code: ['locationcode', 'loccode', 'wardcode', 'countycode', 'location', 'geocode', 'regioncode'],
  year: ['year', 'yr', 'period', 'date', 'fiscalyear', 'reportingyear', 'yr'],
  value: ['value', 'val', 'amount', 'figure', 'data', 'observation', 'result', 'measurement', 'obs'],
  unit: ['unit', 'uom', 'units', 'measure', 'measurementunit', 'scale'],
  source_mcda: ['sourcemcda', 'source', 'ministry', 'agency', 'origin', 'provider', 'publisher'],
  link_to_sdg: ['linktosdg', 'sdg', 'sdglink', 'sdggoal', 'goal', 'sdgtarget'],
};

// ---------------------------------------------------------------------------
// SHA-256 Hashing (Web Crypto API)
// ---------------------------------------------------------------------------

export async function computeSHA256(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ---------------------------------------------------------------------------
// File Parsing
// ---------------------------------------------------------------------------

/**
 * Robust CSV parser handling quoted fields, escaped quotes, CRLF/LF
 */
export function parseCSV(text) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      currentField += char;
      i++;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (char === ',') {
      currentRow.push(currentField);
      currentField = '';
      i++;
      continue;
    }
    if (char === '\n' || char === '\r') {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentField);
      currentField = '';
      rows.push(currentRow);
      currentRow = [];
      i++;
      continue;
    }
    currentField += char;
    i++;
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  if (rows.length === 0) return [];

  const headers = rows[0].map(h => h.trim()).filter(h => h !== '');
  if (headers.length === 0) return [];

  return rows.slice(1)
    .filter(r => r.some(c => c.trim() !== ''))
    .map(row => {
      const obj = {};
      headers.forEach((h, idx) => { obj[h] = (row[idx] || '').trim(); });
      return obj;
    });
}

/**
 * Parse JSON text — handles arrays, {rows:[]}, {data:[]}, {records:[]}, single object
 */
export function parseJSONText(text) {
  const data = JSON.parse(text);
  if (Array.isArray(data)) return data;
  if (data.rows && Array.isArray(data.rows)) return data.rows;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (data.records && Array.isArray(data.records)) return data.records;
  if (data.indicators && Array.isArray(data.indicators)) return data.indicators;
  if (typeof data === 'object' && data !== null) return [data];
  return [];
}

/**
 * Parse XLSX using Base44 ExtractDataFromUploadedFile integration
 */
async function parseXLSX(file) {
  const buffer = await file.arrayBuffer();

  const workbook = XLSX.read(buffer, {
    type: 'array'
  });

  const rows = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];

    if (!worksheet) continue;

    rows.push(
      ...XLSX.utils.sheet_to_json(worksheet, {
        defval: '',
        raw: false
      })
    );
  }

  if (!rows.length) {
    throw new Error('Failed to extract data from XLSX file');
  }

    const output = rows;

  if (Array.isArray(output)) return output;
  if (output?.rows && Array.isArray(output.rows)) return output.rows;
  if (output?.data && Array.isArray(output.data)) return output.data;
  return [];
}

/**
 * Master file parser — dispatches by extension, applies silo-healing
 */
export async function parseFile(file) {
  const ext = file.name.split('.').pop().toUpperCase();
  let rows;

  if (ext === 'JSON') {
    const text = await file.text();
    rows = parseJSONText(text);
  } else if (ext === 'CSV') {
    const text = await file.text();
    rows = parseCSV(text);
  } else if (ext === 'XLSX') {
    rows = await parseXLSX(file);
  } else {
    throw new Error(`Unsupported file type: .${ext}. Supported: CSV, JSON, XLSX`);
  }

  if (!rows || rows.length === 0) {
    throw new Error('No data rows found in file');
  }

  return applySiloHealing(rows);
}

// ---------------------------------------------------------------------------
// Silo-Healing Engine
// ---------------------------------------------------------------------------

/**
 * Forward-fill the first N columns — resolves merged-cell gaps common in
 * government spreadsheet exports. Also normalizes string magnitudes.
 */
export function applySiloHealing(rows, fillColumns = 4) {
  if (rows.length === 0) return rows;
  const headers = Object.keys(rows[0]);
  const fillHeaders = headers.slice(0, fillColumns);

  const healed = rows.map(r => ({ ...r }));

  for (let i = 1; i < healed.length; i++) {
    for (const header of fillHeaders) {
      const val = healed[i][header];
      if (val === undefined || val === null || String(val).trim() === '') {
        healed[i][header] = healed[i - 1][header];
      }
    }
  }
  return healed;
}

/**
 * Normalize string magnitudes: "5.2M" → 5200000, "1,234" → 1234, "KES 50" → 50
 */
export function normalizeMagnitude(value) {
  if (value === null || value === undefined || value === '') return NaN;
  let str = String(value).trim();
  str = str.replace(/^KES\s*/i, '').replace(/^USD\s*/i, '').replace(/^[$]\s*/, '');
  str = str.replace(/,/g, '');
  str = str.replace(/%$/, '');
  const match = str.match(/^(-?\d+\.?\d*)\s*([KMBT]?)/i);
  if (!match) return NaN;
  let num = parseFloat(match[1]);
  const suffix = match[2].toUpperCase();
  if (suffix === 'K') num *= 1e3;
  else if (suffix === 'M') num *= 1e6;
  else if (suffix === 'B') num *= 1e9;
  else if (suffix === 'T') num *= 1e12;
  return num;
}

// ---------------------------------------------------------------------------
// Data Transformation & Validation
// ---------------------------------------------------------------------------

/**
 * Transform a raw row into an indicator record using the mapping
 */
export function transformRow(row, mapping, defaults = {}) {
  const record = {};

  for (const [sourceHeader, targetField] of Object.entries(mapping)) {
    if (!targetField || row[sourceHeader] === undefined) continue;

    const fieldDef = GLOBAL_SCHEMA_FIELDS.find(f => f.key === targetField);
    if (!fieldDef) continue;

    let value = row[sourceHeader];

    if (fieldDef.type === 'integer') {
      value = Math.round(normalizeMagnitude(value));
    } else if (fieldDef.type === 'number') {
      value = normalizeMagnitude(value);
    } else if (fieldDef.type === 'enum') {
      value = String(value).trim();
      const match = fieldDef.enum.find(e => e.toLowerCase() === value.toLowerCase());
      value = match || value;
    } else {
      value = String(value).trim();
    }
    record[targetField] = value;
  }

  // Apply defaults for missing fields
  for (const [key, value] of Object.entries(defaults)) {
    if (value !== undefined && value !== null && value !== '' &&
        (record[key] === undefined || record[key] === null || record[key] === '')) {
      record[key] = key === 'year' ? parseInt(value, 10) : value;
    }
  }

  // Build search_text for RAG
  record.search_text = [
    record.name, record.pillar, record.sector, record.sub_sector,
    record.department, record.location_code, record.year,
    record.value, record.unit, record.source_mcda, record.link_to_sdg,
  ].filter(v => v !== undefined && v !== null && v !== '').join(' ');

  return record;
}

/**
 * Validate a transformed record against the global schema
 */
export function validateRow(row, mapping, defaults = {}) {
  const record = transformRow(row, mapping, defaults);
  const errors = [];

  for (const field of GLOBAL_SCHEMA_FIELDS) {
    const val = record[field.key];

    if (field.required && (val === undefined || val === null || val === '')) {
      errors.push(`Missing required field: ${field.label}`);
      continue;
    }

    if (val === undefined || val === null || val === '') continue;

    if (field.type === 'integer') {
      if (isNaN(val)) {
        errors.push(`${field.label} must be a valid number`);
      } else if (field.min !== undefined && val < field.min) {
        errors.push(`${field.label} must be ≥ ${field.min}`);
      } else if (field.max !== undefined && val > field.max) {
        errors.push(`${field.label} must be ≤ ${field.max}`);
      }
    }

    if (field.type === 'number' && isNaN(val)) {
      errors.push(`${field.label} must be a valid number`);
    }

    if (field.type === 'enum' && !field.enum.includes(val)) {
      errors.push(`${field.label} "${val}" not in: ${field.enum.join(', ')}`);
    }
  }

  return { valid: errors.length === 0, record, errors };
}

// ---------------------------------------------------------------------------
// FAIR Score Calculation
// ---------------------------------------------------------------------------

export function calculateFairScore(record) {
  let score = 0;
  // Findable — has SPI (auto-assigned by DB trigger)
  if (record.indicator_id || record.name) score += 30;
  // Accessible — has source metadata
  if (record.source_mcda) score += 25;
  // Interoperable — has unit and standard fields
  if (record.unit) score += 20;
  // Reusable — has sector and SDG link
  if (record.sector) score += 15;
  if (record.link_to_sdg) score += 10;
  return Math.min(score, 100);
}

// ---------------------------------------------------------------------------
// Auto-Mapping (fuzzy header matching)
// ---------------------------------------------------------------------------

function normalizeHeader(header) {
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function autoSuggestMapping(headers) {
  const mapping = {};
  const usedTargets = new Set();

  for (const header of headers) {
    const normalized = normalizeHeader(header);
    let bestMatch = null;

    for (const [target, aliases] of Object.entries(HEADER_ALIASES)) {
      if (usedTargets.has(target)) continue;
      if (aliases.includes(normalized)) {
        bestMatch = target;
        break;
      }
      for (const alias of aliases) {
        if (normalized === alias || (normalized.length > 3 && (normalized.includes(alias) || alias.includes(normalized)))) {
          bestMatch = target;
          break;
        }
      }
      if (bestMatch) break;
    }

    mapping[header] = bestMatch || '';
    if (bestMatch) usedTargets.add(bestMatch);
  }

  return mapping;
}

// ---------------------------------------------------------------------------
// Session Persistence (survives refresh)
// ---------------------------------------------------------------------------

export const ETL_STATE_KEY = 'kedis-etl-state';

export function saveEtlState(state) {
  const lite = {
    ...state,
    rawRows: state.rawRows ? state.rawRows.slice(0, 5000) : [],
  };
  try {
    sessionStorage.setItem(ETL_STATE_KEY, JSON.stringify(lite));
  } catch (e) {
    // Quota exceeded — save without raw data
    try {
      sessionStorage.setItem(ETL_STATE_KEY, JSON.stringify({ ...lite, rawRows: [], headers: [] }));
    } catch (e2) { /* give up silently */ }
  }
}

export function loadEtlState() {
  try {
    const saved = sessionStorage.getItem(ETL_STATE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
}

export function clearEtlState() {
  sessionStorage.removeItem(ETL_STATE_KEY);
}

// ---------------------------------------------------------------------------
// Display Utilities
// ---------------------------------------------------------------------------

export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}