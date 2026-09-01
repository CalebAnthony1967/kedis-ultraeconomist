/**
 * ============================================================================
 * KEDIS UltraEconomist — ETL Utilities (v15.0 - Strict Column Alignment)
 * ============================================================================
 * File parsing, silo-healing, data contract validation, SHA-256 hashing,
 * header auto-mapping, FAIR scoring, and session persistence.
 *
 * Enhanced for: Strict alignment with KIPPRA county dataset column names.
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

export function applySiloHealing(rows, fillColumns = 6) {
  if (!rows || rows.length === 0) return rows || [];
  const headers = Object.keys(rows[0]);
  const fillHeaders = headers.slice(0, Math.min(fillColumns, headers.length));
  
  const healed = rows.map(r => ({ ...r }));
  let lastSeen = {};

  for (let i = 0; i < healed.length; i++) {
    for (const header of fillHeaders) {
      const val = healed[i][header];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        lastSeen[header] = val;
      } else if (lastSeen[header] !== undefined) {
        healed[i][header] = lastSeen[header];
      }
    }
  }
  return healed;
}

// ---------------------------------------------------------------------------
// Data Transformation & Validation (National)
// ---------------------------------------------------------------------------

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

  for (const [key, value] of Object.entries(defaults)) {
    if (value !== undefined && value !== null && value !== '' &&
        (record[key] === undefined || record[key] === null || record[key] === '')) {
      record[key] = key === 'year' ? parseInt(value, 10) : value;
    }
  }

  record.search_text = [
    record.name, record.pillar, record.sector, record.sub_sector,
    record.department, record.location_code, record.year,
    record.value, record.unit, record.source_mcda, record.link_to_sdg,
  ].filter(v => v !== undefined && v !== null && v !== '').join(' ');

  return record;
}

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
  if (record.indicator_id || record.name) score += 30;
  if (record.source_mcda) score += 25;
  if (record.unit) score += 20;
  if (record.sector) score += 15;
  if (record.link_to_sdg) score += 10;
  return Math.min(score, 100);
}

// ---------------------------------------------------------------------------
// Auto-Mapping (fuzzy header matching) - National
// ---------------------------------------------------------------------------

function normalizeHeader(header) {
  if (!header) return '';
  return header.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function autoSuggestMapping(headers) {
  const mapping = {};
  const usedTargets = new Set();

  if (!headers || headers.length === 0) return mapping;

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

// ============================================================================
// COUNTY & MULTI-SHEET SUPPORT (STRICT COLUMN ALIGNMENT)
// ============================================================================

// ---------------------------------------------------------------------------
// County Schema (Lenient – Only indicator_name is required)
// ---------------------------------------------------------------------------

export const COUNTY_SCHEMA_FIELDS = [
  { key: 'county_code', label: 'County Code', type: 'string', required: false },
  { key: 'county_name', label: 'County Name', type: 'string', required: false },
  { key: 'subcounty_code', label: 'SubCounty Code', type: 'string', required: false },
  { key: 'subcounty_name', label: 'SubCounty Name', type: 'string', required: false },
  { key: 'ward_code', label: 'Ward Code', type: 'string', required: false },
  { key: 'ward_name', label: 'Ward Name', type: 'string', required: false },
  { key: 'pillar', label: 'Pillar', type: 'string', required: false },
  { key: 'mtef_sector', label: 'MTEF Sector', type: 'string', required: false },
  { key: 'mtef_sub_sector', label: 'MTEF Sub-Sector', type: 'string', required: false },
  { key: 'outcome', label: 'Outcome', type: 'string', required: false },
  { key: 'output_name', label: 'Output Name', type: 'string', required: false },
  { key: 'indicator_name', label: 'Indicator Name', type: 'string', required: true },
  { key: 'indicator_description', label: 'Indicator Description', type: 'string', required: false },
  { key: 'unit', label: 'Unit of Measure', type: 'string', required: false },
  { key: 'data_breakdown', label: 'Data Breakdown', type: 'string', required: false },
  { key: 'domain', label: 'Domain', type: 'string', required: false },
  { key: 'sub_domain', label: 'Sub Domain', type: 'string', required: false },
  { key: 'sub_domain_code', label: 'Sub Domain Code', type: 'string', required: false },
  { key: 'baseline_year', label: 'Baseline Year', type: 'integer', required: false },
  { key: 'baseline_value', label: 'Baseline Value', type: 'number', required: false },
  { key: 'data_source', label: 'Data Source', type: 'string', required: false },
  { key: 'link_to_sdg', label: 'Link to SDG', type: 'string', required: false },
];

// ---------------------------------------------------------------------------
// STRICT COUNTY HEADER ALIASES – Exact match for your column names
// ---------------------------------------------------------------------------

const COUNTY_HEADER_ALIASES = {
  // Geography – Exact match from your dataset
  county_code: ['County_Code', 'CountyCode', 'county_code', 'countycode', 'County Code', 'county code'],
  county_name: ['County_Name', 'CountyName', 'county_name', 'countyname', 'County Name', 'county name'],
  subcounty_code: ['SubCounty_Code', 'SubCountyCode', 'subcounty_code', 'subcountycode', 'SubCounty Code', 'subcounty code'],
  subcounty_name: ['SubCounty_Name', 'SubCountyName', 'subcounty_name', 'subcountyname', 'SubCounty Name', 'subcounty name'],
  ward_code: ['Ward_Code', 'WardCode', 'ward_code', 'wardcode', 'Ward Code', 'ward code'],
  ward_name: ['Ward_Name', 'WardName', 'ward_name', 'wardname', 'Ward Name', 'ward name'],
  
  // Policy Taxonomy – Exact match
  pillar: ['Pillar', 'pillar', 'PILLAR'],
  mtef_sector: ['MTEF_Sector', 'MTEFSector', 'mtef_sector', 'mtefsector', 'MTEF Sector', 'sector'],
  mtef_sub_sector: ['MTEF_Sub_Sector', 'MTEFSubSector', 'mtef_sub_sector', 'mtefsubsector', 'MTEF Sub Sector', 'subsector'],
  outcome: ['Outcome', 'outcome', 'OUTCOME'],
  output_name: ['Output_Name', 'OutputName', 'output_name', 'outputname', 'Output Name', 'output name'],
  
  // Core Indicator – Exact match
  indicator_name: ['Indicator_Name', 'IndicatorName', 'indicator_name', 'indicatorname', 'Indicator Name', 'indicator name', 'Indicator'],
  unit: ['Unit_of_Measure', 'UnitOfMeasure', 'unit_of_measure', 'unitofmeasure', 'Unit of Measure', 'unit', 'Unit'],
  data_breakdown: ['Data_Breakdown', 'DataBreakdown', 'data_breakdown', 'databreakdown', 'Data Breakdown', 'breakdown'],
  
  // Domain Classification – Exact match
  domain: ['Domain', 'domain', 'DOMAIN'],
  sub_domain: ['Sub_domain', 'Subdomain', 'sub_domain', 'subdomain', 'Sub Domain', 'sub domain'],
  sub_domain_code: ['Sub_domain_Code', 'SubdomainCode', 'sub_domain_code', 'subdomaincode', 'Sub Domain Code', 'sub domain code'],
  
  // Time Series – Exact match
  baseline_year: ['Baseline_Year', 'BaselineYear', 'baseline_year', 'baselineyear', 'Baseline Year', 'baseline year'],
  baseline_value: ['Baseline_Value', 'BaselineValue', 'baseline_value', 'baselinevalue', 'Baseline Value', 'baseline value'],
  
  // Metadata – Exact match
  data_source: ['Data_Source', 'DataSource', 'data_source', 'datasource', 'Data Source', 'data source', 'Source'],
  link_to_sdg: ['Link_to_SDG', 'LinkToSDG', 'link_to_sdg', 'linktosdg', 'Link to SDG', 'sdg', 'SDG'],
};

// ============================================================================
// NEW: Pillar Enum Mapping Function
// ============================================================================

/**
 * Maps county pillar values to valid PostgreSQL enum values for the 'pillar' column.
 * 
 * County pillar values in the dataset:
 * - "Foundations/Infrastructure Pillar" → "Governance"
 * - "Social Pillar" → "Social"
 * - "Economic Pillar" → "Economic"
 * - "Governance/Enablers Pillar" → "Governance"
 * - "Environment Pillar" → "Environmental"
 * - "Political Pillar" → "Political"
 */
export function mapCountyPillarToEnum(countyPillar) {
  if (!countyPillar || typeof countyPillar !== 'string') return null;
  
  // Trim and clean the input
  const cleaned = countyPillar.trim();
  
  // Exact matches (case-sensitive)
  const exactMap = {
    'Foundations/Infrastructure Pillar': 'Governance',
    'Foundations/Infrastructure': 'Governance',
    'Infrastructure Pillar': 'Governance',
    'Social Pillar': 'Social',
    'Economic Pillar': 'Economic',
    'Governance/Enablers Pillar': 'Governance',
    'Governance Pillar': 'Governance',
    'Environmental Pillar': 'Environmental',
    'Political Pillar': 'Political',
  };
  
  if (exactMap[cleaned]) return exactMap[cleaned];
  
  // Case-insensitive partial matches
  const lower = cleaned.toLowerCase();
  if (lower.includes('economic')) return 'Economic';
  if (lower.includes('social')) return 'Social';
  if (lower.includes('governance')) return 'Governance';
  if (lower.includes('enablers')) return 'Governance';
  if (lower.includes('infrastructure')) return 'Governance';
  if (lower.includes('foundations')) return 'Governance';
  if (lower.includes('environmental')) return 'Environmental';
  if (lower.includes('political')) return 'Political';
  
  // If nothing matches, return null (will be set to NULL in DB)
  return null;
}

// ---------------------------------------------------------------------------
// Auto-Mapping for County – Strict alignment
// ---------------------------------------------------------------------------

export function autoSuggestMappingCounty(headers) {
  const mapping = {};
  const usedTargets = new Set();

  if (!headers || headers.length === 0) return mapping;

  console.log('🔍 County Auto-Mapping - Headers:', headers);

  for (const header of headers) {
    const trimmedHeader = header.trim();
    let bestMatch = null;
    let matchScore = 0;

    for (const [target, aliases] of Object.entries(COUNTY_HEADER_ALIASES)) {
      if (usedTargets.has(target)) continue;
      
      for (const alias of aliases) {
        if (trimmedHeader === alias) {
          bestMatch = target;
          matchScore = 3;
          break;
        }
        if (trimmedHeader.toLowerCase() === alias.toLowerCase()) {
          bestMatch = target;
          matchScore = 2;
          break;
        }
        if (trimmedHeader.length > 2 && alias.length > 2) {
          const headerLower = trimmedHeader.toLowerCase();
          const aliasLower = alias.toLowerCase();
          if (headerLower.includes(aliasLower) || aliasLower.includes(headerLower)) {
            if (matchScore < 1) {
              bestMatch = target;
              matchScore = 1;
            }
          }
        }
      }
      if (matchScore === 3) break;
    }

    if (!bestMatch && /^\d{4}$/.test(trimmedHeader)) {
      bestMatch = '';
    }

    mapping[header] = bestMatch || '';
    if (bestMatch) usedTargets.add(bestMatch);
  }

  console.log('📋 County Mapping Result:', mapping);
  return mapping;
}

// ---------------------------------------------------------------------------
// Detect Data Format – Strict detection
// ---------------------------------------------------------------------------

export function detectDataFormat(headers) {
  if (!headers || headers.length === 0) return 'national';
  
  const countyColumns = [
    'County_Code', 'County_Name', 'SubCounty_Code', 'SubCounty_Name',
    'Ward_Code', 'Ward_Name'
  ];
  
  const headerSet = new Set(headers.map(h => h.trim()));
  const hasCountyColumn = countyColumns.some(col => headerSet.has(col));
  
  const headerLowerSet = new Set(headers.map(h => h.trim().toLowerCase()));
  const hasCountyLower = countyColumns.some(col => headerLowerSet.has(col.toLowerCase()));
  
  console.log('🔍 detectDataFormat:', { hasCountyColumn, hasCountyLower, headers: headers.slice(0, 5) });
  
  return (hasCountyColumn || hasCountyLower) ? 'county' : 'national';
}

// ---------------------------------------------------------------------------
// County-Specific Validation – Lenient & Intelligent
// ---------------------------------------------------------------------------

export function validateCountyRow(row, mapping, defaults = {}) {
  const record = {};
  const errors = [];

  if (!row) return { valid: false, record: {}, errors: ['Empty row provided'] };

  for (const [sourceHeader, targetField] of Object.entries(mapping)) {
    if (!targetField || row[sourceHeader] === undefined) continue;
    const fieldDef = COUNTY_SCHEMA_FIELDS.find(f => f.key === targetField);
    if (!fieldDef) continue;
    
    let value = row[sourceHeader];
    if (fieldDef.type === 'integer') {
      value = Math.round(normalizeMagnitude(value));
    } else if (fieldDef.type === 'number') {
      value = normalizeMagnitude(value);
    } else {
      value = String(value || '').trim();
    }
    record[targetField] = value;
  }

  for (const [key, value] of Object.entries(defaults)) {
    if (value !== undefined && value !== null && value !== '' &&
        (record[key] === undefined || record[key] === null || record[key] === '')) {
      record[key] = value;
    }
  }

  if (!record.indicator_name || record.indicator_name === '') {
    errors.push('Missing required field: Indicator Name');
  }

  if (record.county_code && !/^\d{3}$/.test(record.county_code)) {
    errors.push(`Invalid county_code format: ${record.county_code}. Expected 3 digits.`);
  }

  return { valid: errors.length === 0, record, errors };
}

// ---------------------------------------------------------------------------
// County Row Transformation (Expands Years) – Fully Automatic
// ---------------------------------------------------------------------------

export async function transformCountyRow(row, mapping, defaults = {}, domainResolver) {
  const baseRecord = {};
  if (!row) return [];

  for (const [sourceHeader, targetField] of Object.entries(mapping)) {
    if (!targetField || row[sourceHeader] === undefined) continue;
    const fieldDef = COUNTY_SCHEMA_FIELDS.find(f => f.key === targetField);
    if (!fieldDef) continue;
    let value = row[sourceHeader];
    if (fieldDef.type === 'integer') {
      value = Math.round(normalizeMagnitude(value));
    } else if (fieldDef.type === 'number') {
      value = normalizeMagnitude(value);
    } else {
      value = String(value || '').trim();
    }
    baseRecord[targetField] = value;
  }

  for (const [key, value] of Object.entries(defaults)) {
    if (value !== undefined && value !== null && value !== '' &&
        (baseRecord[key] === undefined || baseRecord[key] === null || baseRecord[key] === '')) {
      baseRecord[key] = value;
    }
  }

  const indicatorName = baseRecord.indicator_name || 'unknown';
  const countyCode = baseRecord.county_code || '000';
  const subDomainCode = baseRecord.sub_domain_code || 'gen';
  const indicatorId = indicatorName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .substring(0, 50) + '_' + countyCode + '_' + subDomainCode;

  baseRecord.indicator_id = indicatorId;

  let subdomainId = null;
  if (baseRecord.sub_domain_code && domainResolver) {
    try {
      subdomainId = await domainResolver(
        baseRecord.domain,
        baseRecord.sub_domain_code,
        baseRecord.sub_domain
      );
    } catch (e) {
      console.warn('Domain lookup failed:', e);
    }
  }

  const yearColumns = Object.keys(row).filter(h => /^\d{4}$/.test(h));
  const records = [];

  for (const yearKey of yearColumns) {
    const year = parseInt(yearKey, 10);
    const rawValue = row[yearKey];
    if (rawValue === undefined || rawValue === null || rawValue === '') continue;

    const value = normalizeMagnitude(rawValue);
    if (value === null) continue;

    const record = {
      ...baseRecord,
      year,
      value,
      subdomain_id: subdomainId,
    };

    delete record.domain;
    delete record.sub_domain;
    delete record.sub_domain_code;

    records.push(record);
  }

  return records;
}

// ---------------------------------------------------------------------------
// Domain/Subdomain Auto-Creation Helper
// ---------------------------------------------------------------------------

export async function getOrCreateDomainSubdomain(supabaseClient, domainName, subdomainCode, subdomainName) {
  if (!subdomainCode) return null;

  try {
    const { data: existingSub, error: subError } = await supabaseClient
      .from('subdomains')
      .select('id, domain_id')
      .eq('code', subdomainCode)
      .maybeSingle();

    if (subError) {
      console.warn('Error fetching subdomain:', subError);
      return null;
    }

    if (existingSub) return existingSub.id;

    let domainId = null;
    if (domainName) {
      const { data: existingDomain, error: domError } = await supabaseClient
        .from('domains')
        .select('id')
        .eq('name', domainName)
        .maybeSingle();

      if (domError) {
        console.warn('Error fetching domain:', domError);
        return null;
      }

      if (existingDomain) {
        domainId = existingDomain.id;
      } else {
        const { data: newDomain, error: createDomError } = await supabaseClient
          .from('domains')
          .insert({ name: domainName, code: `custom-${Date.now()}` })
          .select('id')
          .single();

        if (createDomError) {
          console.warn('Error creating domain:', createDomError);
          return null;
        }
        domainId = newDomain.id;
      }
    }

    const { data: newSub, error: createSubError } = await supabaseClient
      .from('subdomains')
      .insert({
        code: subdomainCode,
        name: subdomainName || subdomainCode,
        domain_id: domainId,
      })
      .select('id')
      .single();

    if (createSubError) {
      console.warn('Error creating subdomain:', createSubError);
      return null;
    }

    return newSub.id;
  } catch (e) {
    console.warn('Domain/subdomain resolution failed:', e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Multi-Sheet XLSX Parser
// ---------------------------------------------------------------------------

export async function parseMultiSheetXLSX(file, applyHealing = true) {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const allRows = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    const sheetRows = XLSX.utils.sheet_to_json(worksheet, {
      defval: '',
      raw: false,
    });

    if (sheetRows.length === 0) continue;

    const rowsWithSheet = sheetRows.map(row => ({
      ...row,
      __sheet: sheetName,
    }));

    if (applyHealing) {
      const healedRows = applySiloHealing(rowsWithSheet, 6);
      allRows.push(...healedRows);
    } else {
      allRows.push(...rowsWithSheet);
    }
  }

  if (allRows.length === 0) {
    throw new Error('No data found in any sheet.');
  }

  return allRows;
}

// ---------------------------------------------------------------------------
// County File Parser – Returns sheets grouped by name
// ---------------------------------------------------------------------------

export async function parseCountyFile(file) {
  const ext = file.name.split('.').pop().toUpperCase();
  if (ext !== 'XLSX') {
    throw new Error('County data must be in XLSX format (multi-sheet workbook).');
  }

  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheets = {};
  let allHeaders = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    const sheetRows = XLSX.utils.sheet_to_json(worksheet, {
      defval: '',
      raw: false,
    });

    if (sheetRows.length === 0) continue;

    const healedRows = applySiloHealing(sheetRows, 6);
    if (healedRows && healedRows.length > 0) {
      sheets[sheetName] = healedRows;
      if (allHeaders.length === 0) {
        allHeaders = Object.keys(healedRows[0]);
      }
    } else {
      sheets[sheetName] = [];
    }
  }

  if (Object.keys(sheets).length === 0) {
    throw new Error('No data found in any sheet.');
  }

  if (allHeaders.length === 0) {
    for (const sheetName of Object.keys(sheets)) {
      if (sheets[sheetName] && sheets[sheetName].length > 0) {
        allHeaders = Object.keys(sheets[sheetName][0]);
        break;
      }
    }
  }

  return { sheets, headers: allHeaders };
}

// ---------------------------------------------------------------------------
// Normalize Magnitude – Fail-Proof Numeric Sanitizer
// ---------------------------------------------------------------------------

export function normalizeMagnitude(value) {
  if (value === null || value === undefined || value === '') return null;
  let str = String(value).trim().toLowerCase();
  
  const markers = ['...', '-', 'n/a', 'nil', 'tbd', 'none', 'nan', 'pending', 'unknown', 'not available'];
  if (markers.includes(str)) return null;

  str = str.replace(/[KES|USD|$|,|%]/gi, '');
  const match = str.match(/^(-?\d+\.?\d*)\s*([KMBT]?)/i);
  if (!match) return null;
  
  let num = parseFloat(match[1]);
  const suffix = (match[2] || '').toUpperCase();
  if (suffix === 'K') num *= 1e3;
  else if (suffix === 'M') num *= 1e6;
  else if (suffix === 'B') num *= 1e9;
  else if (suffix === 'T') num *= 1e12;
  return num;
}

// ---------------------------------------------------------------------------
// Sanitize Value – Resilience Helper
// ---------------------------------------------------------------------------

export function sanitizeValue(val) {
  if (val === null || val === undefined) return null;
  const s = String(val).trim().toLowerCase();
  const markers = ['...', '-', 'n/a', 'nil', 'none', 'tbd', 'nan', 'pending', 'unknown', 'not available'];
  if (markers.includes(s)) return null;
  const numeric = parseFloat(s.replace(/[^0-9.-]+/g, ""));
  return isNaN(numeric) ? null : numeric;
}
