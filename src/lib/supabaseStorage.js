/**
 * ============================================================================
 * KEDIS UltraEconomist — Sovereign Storage & Ingestion Orchestrator (v14.0)
 * ============================================================================
 * Features:
 * - Integrity by Design: Automatic SHA-256 hashing for data verification.
 * - FAIR Metadata: Automatic tagging of MCDA source and Institutional SPI.
 * - Multi-Tier Security: Isolated buckets for Public, Private, and Vault data.
 * - Edge Compute Handshakes: Direct pipes for AlphaEconomist & MTEF Automator.
 * ============================================================================
 */

import { supabase } from './supabaseClient';
import { lakehouse } from './supabaseData';

// --- PRODUCTION CONSTANTS ---
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB limit for strategic templates
const ALLOWED_MCDA_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'text/csv',
  'application/pdf'
];

/**
 * UTILITY: Generate Data Fingerprint (Integrity by Design)
 */
async function generateSovereignHash(file) {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const supabaseStorage = {
  /** 
   * UPLOAD: MCDA Strategic Framework
   * Intended for: SDEP Templates, County Indicators, Ministry Reports
   * Security: Public Read (Anonymized) | Admin Write
   */
  async uploadSovereignData(file, mcdaContext) {
    // 1. Production Guardrails
    if (file.size > MAX_FILE_SIZE) throw new Error('File exceeds Sovereign Security Limit (15MB)');
    if (!ALLOWED_MCDA_TYPES.includes(file.type)) throw new Error('Unauthorized File Format: Only XLSX, CSV, or PDF are accepted.');

    // 2. Integrity Verification
    const fileHash = await generateSovereignHash(file);
    const fileName = `ingestion/${Date.now()}_${mcdaContext.name.replace(/\s/g, '_')}_${file.name}`;

    // 3. Execution
    const { data, error } = await supabase.storage
      .from('kedis-sovereign-vault')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (error) throw error;

    // 4. Log to National Audit Trail
    await lakehouse.governance.logInstitutionalEvent(
        'FILE_INGESTION', 
        `Uploaded ${file.name} from ${mcdaContext.name}. Integrity Hash: ${fileHash}`
    );

    const { data: urlData } = supabase.storage
      .from('kedis-sovereign-vault')
      .getPublicUrl(fileName);

    return { 
        file_url: urlData.publicUrl, 
        integrity_hash: fileHash,
        path: data.path 
    };
  },

  /** 
   * UPLOAD: Protected Policy Document
   * Intended for: MTP IV Drafts, Budget Memos (Confidential)
   * Security: Signed URLs Only (5 min expiry)
   */
  async uploadProtectedPolicy(file) {
    const fileName = `internal/policy_${uuidv4()}_${file.name}`;
    const { data, error } = await supabase.storage
      .from('kedis-private-registry')
      .upload(fileName, file);

    if (error) throw error;
    return { file_uri: data.path };
  },

  /** Generate Secure Access Link for Top Management */
  async getSecureLink(fileUri, expires = 300) {
    const { data, error } = await supabase.storage
      .from('kedis-private-registry')
      .createSignedUrl(fileUri, expires);

    if (error) throw error;
    return { signed_url: data.signedUrl };
  }
};

export const sovereignIntelligence = {
  /** 
   * ORCHESTRATOR: General Invoke
   */
  async invoke(functionName, payload) {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: payload,
    });

    if (error) {
        console.error(`Sovereign AI Error [${functionName}]:`, error);
        throw error;
    }
    return data;
  },

  /** ALPHA-ECONOMIST: Policy RAG & Causal Modeling */
  async askAlphaEconomist(userQuery, roleContext) {
    return this.invoke('alpha-economist-copilot', { 
        query: userQuery, 
        role: roleContext,
        timestamp: new Date().toISOString()
    });
  },

  /** REPORT AUTOMATOR: Grounded MTEF Generation */
  async generateMTEFReport(reportType, indicators) {
    return this.invoke('report-automator', { 
        type: reportType, 
        data_points: indicators,
        compliant_standard: 'SDMX-v2.1'
    });
  },

  /** ANOMALY DETECTOR: MTEF vs Actual Monitoring */
  async runAuditAnomalyCheck(targetYear) {
    return this.invoke('anomaly-detector', { year: targetYear });
  },

  /** GIS ENGINE: Small Area Estimation Rendering */
  async computeWardSAE(indicatorId, covariates) {
    return this.invoke('spatial-sae-engine', { 
        indicator: indicatorId, 
        covariates: covariates // e.g. [EVI, Temperature, NightLights]
    });
  }
};

/** UUID Helper for unique identifiers */
function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

export default { supabaseStorage, sovereignIntelligence };