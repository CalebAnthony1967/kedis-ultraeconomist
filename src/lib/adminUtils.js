/**
 * KEDIS UltraEconomist — Shared Admin Utilities
 * Supabase table mapping, audit logging, and toast helpers.
 */
import { supabase } from './supabaseClient';
import { supabaseAuth } from './supabaseAuth';
import { toast } from '@/components/ui/use-toast';

// ---------------------------------------------------------------------------
// Toast Helpers — green (success), red (error), orange (warning)
// ---------------------------------------------------------------------------

export const toastSuccess = (title, description) =>
  toast({ title, description, variant: 'success', duration: 4000 });

export const toastError = (title, description) =>
  toast({ title, description, variant: 'destructive', duration: 6000 });

export const toastWarning = (title, description) =>
  toast({ title, description, variant: 'warning', duration: 5000 });

// ---------------------------------------------------------------------------
// Entity → Supabase Table Mapping (for Registry Explorer)
// ---------------------------------------------------------------------------

export const ENTITY_CONFIGS = {
  indicators: {
    label: 'Indicators',
    table: 'indicators',
    excludeColumns: ['id', 'created_at', 'updated_at', 'created_by', 'embedding', 'search_text'],
    enumColumns: {
      pillar: ['Economic', 'Social', 'Governance', 'Environmental', 'Political'],
    },
    booleanColumns: ['is_verified', 'is_hidden'],
    canHide: true,
  },
  ward_data: {
    label: 'Ward Data',
    table: 'ward_data',
    excludeColumns: ['id', 'created_at', 'updated_at', 'created_by', 'latitude', 'longitude'],
    canHide: true,
  },
  data_ingestion_jobs: {
    label: 'Ingestion Jobs',
    table: 'data_ingestion_jobs',
    excludeColumns: ['id', 'created_at', 'updated_at', 'created_by', 'file_uri'],
    enumColumns: {
      status: ['pending', 'validating', 'transforming', 'ingested', 'failed', 'anomaly'],
      file_type: ['XLSX', 'CSV', 'JSON', 'SQL'],
    },
    booleanColumns: ['spi_assigned'],
  },
  data_connectors: {
    label: 'Connectors',
    table: 'data_connectors',
    excludeColumns: ['id', 'created_at', 'updated_at', 'created_by', 'api_key_ref'],
    enumColumns: {
      type: ['KNBS_SDMX', 'CBK_Bulletin', 'Treasury_BPS', 'SurveyCTO', 'KOBO_Toolbox', 'Satellite_NightLights', 'Mobile_Money'],
      status: ['active', 'paused', 'error', 'syncing'],
    },
    booleanColumns: ['auto_sync'],
  },
  policy_scenarios: {
    label: 'Policy Scenarios',
    table: 'policy_scenarios',
    excludeColumns: ['id', 'created_at', 'updated_at', 'created_by'],
    enumColumns: {
      status: ['draft', 'saved', 'approved', 'archived'],
    },
  },
  sdg_targets: {
    label: 'SDG Targets',
    table: 'sdg_targets',
    excludeColumns: ['id', 'created_at', 'updated_at', 'created_by'],
    canHide: true,
  },
  citizen_feedback: {
    label: 'Citizen Feedback',
    table: 'citizen_feedback',
    excludeColumns: ['id', 'created_at', 'updated_at', 'submitter_ip', 'is_red_flag'],
    enumColumns: {
      project_status: ['not_started', 'in_progress', 'completed', 'stalled', 'abandoned'],
      submitter_type: ['citizen', 'ward_planner', 'researcher'],
      language: ['en', 'sw'],
    },
    booleanColumns: ['is_anonymous', 'is_hidden'],
    canHide: true,
  },
  report_drafts: {
    label: 'Report Drafts',
    table: 'report_drafts',
    excludeColumns: ['id', 'created_at', 'updated_at', 'created_by', 'approved_by'],
    enumColumns: {
      status: ['draft', 'review', 'approved', 'routed'],
    },
  },
};

// ---------------------------------------------------------------------------
// Audit Logging
// ---------------------------------------------------------------------------

export async function logAudit(action, targetEntity, targetId, details) {
  try {
    const user = await supabaseAuth.me();
    if (!user) return;
    await supabase.from('audit_logs').insert({
      action,
      user_email: user.email,
      user_role: user.portal_role || 'admin',
      target_entity: targetEntity,
      target_id: targetId ? String(targetId) : null,
      details,
    });
  } catch (e) {
    // Audit logging is best-effort
  }
}

// ---------------------------------------------------------------------------
// Format Helpers
// ---------------------------------------------------------------------------

export function formatRelativeTime(dateString) {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString();
}

export function formatCellValue(value) {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') return JSON.stringify(value).slice(0, 50);
  return String(value);
}

export function truncate(str, len = 50) {
  if (!str) return '—';
  const s = String(str);
  return s.length > len ? s.slice(0, len) + '…' : s;
}