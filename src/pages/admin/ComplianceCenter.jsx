import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/lib/i18n';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { supabaseAuth } from '@/lib/supabaseAuth';
import { logAudit, toastSuccess, toastError, toastWarning, formatRelativeTime } from '@/lib/adminUtils';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Shield, Lock, Eye, EyeOff, ToggleLeft, ToggleRight, FileCheck,
  AlertTriangle, CheckCircle2, Loader2, Send, Clock, Plus, X, Save,
  UserCog, Database, ScrollText, Activity, Trash2, FileText
} from 'lucide-react';

const DEFAULT_SENSITIVE_COLUMNS = [
  { column_name: 'researcher_name', label: 'Researcher Names', mask_type: 'REDACT' },
  { column_name: 'contractor_name', label: 'Project Contractors', mask_type: 'REDACT' },
  { column_name: 'phone_number', label: 'Phone Numbers', mask_type: 'MASK' },
  { column_name: 'national_id', label: 'National IDs', mask_type: 'REDACT' },
  { column_name: 'salary_data', label: 'Salary Data', mask_type: 'REDACT' },
  { column_name: 'location_precise', label: 'Precise Locations', mask_type: 'HASH' },
  { column_name: 'submitter_ip', label: 'IP Addresses', mask_type: 'HASH' },
  { column_name: 'personal_id', label: 'Personal Identifiers', mask_type: 'REDACT' },
];

const MASK_TYPES = ['REDACT', 'MASK', 'HASH', 'ENCRYPT'];

const DSAR_TYPES = ['access', 'rectification', 'erasure', 'portability', 'objection'];
const DSAR_STATUSES = ['pending', 'in_review', 'completed', 'rejected'];

export default function ComplianceCenter() {
  const { lang } = useLanguage();
  const [privacyConfigs, setPrivacyConfigs] = useState([]);
  const [reports, setReports] = useState([]);
  const [dsarRequests, setDsarRequests] = useState([]);
  const [retentionPolicies, setRetentionPolicies] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('privacy');
  const [showDSARForm, setShowDSARForm] = useState(false);
  const [showRetentionPolicyForm, setShowRetentionPolicyForm] = useState(false);

  // -------------------------------------------------------------------------
  // Load all data from Supabase
  // -------------------------------------------------------------------------
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [privacyRes, reportsRes, dsarRes, retentionRes, auditRes] = await Promise.all([
        supabase.from('privacy_config').select('*').order('column_name'),
        supabase.from('report_drafts').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('dsar_requests').select('*').order('created_at', { ascending: false }).limit(20),
        supabase.from('data_retention_policies').select('*').order('table_name'),
        supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(15),
      ]);

      setPrivacyConfigs(privacyRes.data || []);
      setReports(reportsRes.data || []);
      setDsarRequests(dsarRes.data || []);
      setRetentionPolicies(retentionRes.data || []);
      setAuditLogs(auditRes.data || []);
    } catch (e) {
      toastError('Failed to load compliance data', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  // -------------------------------------------------------------------------
  // Privacy Toggle
  // -------------------------------------------------------------------------
  const handleTogglePrivacy = async (config) => {
    const newMasked = !config.is_masked;
    setPrivacyConfigs(prev => prev.map(c => c.id === config.id ? { ...c, is_masked: newMasked } : c));
    try {
      const user = await supabaseAuth.me();
      await supabase
        .from('privacy_config')
        .update({ is_masked: newMasked, updated_by: user?.id, updated_at: new Date().toISOString() })
        .eq('id', config.id);
      await logAudit('edit', 'privacy_config', config.id, `${newMasked ? 'Masked' : 'Exposed'} column: ${config.column_name}`);
      if (newMasked) {
        toastSuccess('Column masked', `${config.column_name} is now hidden from public`);
      } else {
        toastWarning('Column exposed', `${config.column_name} is now visible to public`);
      }
    } catch (e) {
      setPrivacyConfigs(prev => prev.map(c => c.id === config.id ? { ...c, is_masked: config.is_masked } : c));
      toastError('Failed to toggle privacy', e.message);
    }
  };

  const handleMaskTypeChange = async (config, newType) => {
    setPrivacyConfigs(prev => prev.map(c => c.id === config.id ? { ...c, mask_type: newType } : c));
    try {
      const user = await supabaseAuth.me();
      await supabase
        .from('privacy_config')
        .update({ mask_type: newType, updated_by: user?.id, updated_at: new Date().toISOString() })
        .eq('id', config.id);
      toastSuccess('Mask type updated', `${config.column_name}: ${newType}`);
    } catch (e) {
      toastError('Failed to update mask type', e.message);
    }
  };

  // -------------------------------------------------------------------------
  // Report Routing
  // -------------------------------------------------------------------------
  const handleApproveReport = async (report) => {
    try {
      const user = await supabaseAuth.me();
      await supabase
        .from('report_drafts')
        .update({ status: 'approved', routed_to: "President's Office", approved_by: user?.id })
        .eq('id', report.id);
      setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'approved', routed_to: "President's Office" } : r));
      await logAudit('edit', 'report_drafts', report.id, `Approved & routed report: ${report.title}`);
      toastSuccess('Report approved', `${report.title} routed to President's Office`);
    } catch (e) {
      toastError('Failed to approve report', e.message);
    }
  };

  const handleRejectReport = async (report) => {
    try {
      await supabase
        .from('report_drafts')
        .update({ status: 'draft' })
        .eq('id', report.id);
      setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'draft' } : r));
      await logAudit('edit', 'report_drafts', report.id, `Rejected report: ${report.title}`);
      toastWarning('Report rejected', `${report.title} sent back to draft`);
    } catch (e) {
      toastError('Failed to reject report', e.message);
    }
  };

  // -------------------------------------------------------------------------
  // DSAR Management
  // -------------------------------------------------------------------------
  const handleCreateDSAR = async (data) => {
    try {
      const { data: newReq, error } = await supabase
        .from('dsar_requests')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      setDsarRequests(prev => [newReq, ...prev]);
      await logAudit('upload', 'dsar_requests', newReq.id, `Created DSAR: ${data.request_type} for ${data.requester_email}`);
      toastSuccess('DSAR created', 'Data subject access request filed');
      setShowDSARForm(false);
    } catch (e) {
      toastError('Failed to create DSAR', e.message);
    }
  };

  const handleUpdateDSARStatus = async (dsar, newStatus) => {
    try {
      const updates = { status: newStatus };
      if (newStatus === 'completed' || newStatus === 'rejected') {
        updates.resolved_at = new Date().toISOString();
      }
      await supabase.from('dsar_requests').update(updates).eq('id', dsar.id);
      setDsarRequests(prev => prev.map(d => d.id === dsar.id ? { ...d, ...updates } : d));
      await logAudit('edit', 'dsar_requests', dsar.id, `DSAR status changed to: ${newStatus}`);
      toastSuccess('DSAR updated', `Status: ${newStatus}`);
    } catch (e) {
      toastError('Failed to update DSAR', e.message);
    }
  };

  const handleDeleteDSAR = async (dsar) => {
    if (!confirm('Delete this DSAR request? This is permanent.')) return;
    try {
      await supabase.from('dsar_requests').delete().eq('id', dsar.id);
      setDsarRequests(prev => prev.filter(d => d.id !== dsar.id));
      await logAudit('delete', 'dsar_requests', dsar.id, `Deleted DSAR: ${dsar.requester_email}`);
      toastSuccess('DSAR deleted', 'Request removed from system');
    } catch (e) {
      toastError('Failed to delete DSAR', e.message);
    }
  };

  // -------------------------------------------------------------------------
  // Retention Policy Management
  // -------------------------------------------------------------------------
  const handleCreateRetentionPolicy = async (data) => {
    try {
      const { data: newPolicy, error } = await supabase
        .from('data_retention_policies')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      setRetentionPolicies(prev => [...prev, newPolicy]);
      await logAudit('upload', 'data_retention_policies', newPolicy.id, `Created retention policy for ${data.table_name}`);
      toastSuccess('Policy created', `Retention rule for ${data.table_name} added`);
      setShowRetentionPolicyForm(false);
    } catch (e) {
      toastError('Failed to create policy', e.message);
    }
  };

  const handleToggleRetentionPolicy = async (policy) => {
    try {
      const newActive = !policy.is_active;
      await supabase.from('data_retention_policies').update({ is_active: newActive }).eq('id', policy.id);
      setRetentionPolicies(prev => prev.map(p => p.id === policy.id ? { ...p, is_active: newActive } : p));
      if (newActive) {
        toastSuccess('Policy activated', `${policy.table_name} retention is now enforced`);
      } else {
        toastWarning('Policy disabled', `${policy.table_name} retention is paused`);
      }
    } catch (e) {
      toastError('Failed to toggle policy', e.message);
    }
  };

  const handleDeleteRetentionPolicy = async (policy) => {
    if (!confirm('Delete this retention policy?')) return;
    try {
      await supabase.from('data_retention_policies').delete().eq('id', policy.id);
      setRetentionPolicies(prev => prev.filter(p => p.id !== policy.id));
      toastSuccess('Policy deleted', 'Retention rule removed');
    } catch (e) {
      toastError('Failed to delete policy', e.message);
    }
  };

  // -------------------------------------------------------------------------
  // Merge default columns with DB configs
  // -------------------------------------------------------------------------
  const mergedPrivacyConfigs = DEFAULT_SENSITIVE_COLUMNS.map(def => {
    const dbConfig = privacyConfigs.find(c => c.column_name === def.column_name);
    return dbConfig || { ...def, id: def.column_name, is_masked: true, mask_type: def.mask_type };
  });

  const maskedCount = mergedPrivacyConfigs.filter(c => c.is_masked).length;
  const pendingReports = reports.filter(r => r.status === 'draft' || r.status === 'review').length;
  const pendingDSARs = dsarRequests.filter(d => d.status === 'pending' || d.status === 'in_review').length;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="p-20 text-center">
        <Loader2 className="h-8 w-8 text-amber-600 animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-6 w-6 text-amber-600" />
            <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-foreground">
              {lang === 'sw' ? 'Kituo cha Uzingatiaji' : 'Compliance & Privacy Center'}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {lang === 'sw'
              ? 'Udhibiti wa Jumla wa Ufichaji wa KDPA na Mkono wa Sera ya Uelekeo.'
              : 'KDPA Anonymization Engine, Data Subject Rights, Retention Policies & Sovereign Routing Control.'}
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-muted-foreground">Masked Columns</span>
            </div>
            <div className="text-2xl font-display font-bold text-foreground">{maskedCount}/{mergedPrivacyConfigs.length}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileCheck className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-muted-foreground">Pending Reports</span>
            </div>
            <div className="text-2xl font-display font-bold text-foreground">{pendingReports}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <UserCog className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-muted-foreground">Open DSARs</span>
            </div>
            <div className="text-2xl font-display font-bold text-foreground">{pendingDSARs}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <ScrollText className="h-4 w-4 text-amber-600" />
              <span className="text-xs text-muted-foreground">Retention Rules</span>
            </div>
            <div className="text-2xl font-display font-bold text-foreground">{retentionPolicies.length}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: 'privacy', label: 'Anonymization', icon: Lock },
            { key: 'routing', label: 'Report Routing', icon: FileCheck },
            { key: 'dsar', label: 'Data Subject Rights', icon: UserCog },
            { key: 'retention', label: 'Retention Policies', icon: ScrollText },
            { key: 'audit', label: 'Audit Trail', icon: Activity },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-card border border-border text-muted-foreground hover:bg-secondary'
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'privacy' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="h-5 w-5 text-amber-600" />
              <h2 className="font-heading font-bold text-foreground">Anonymization Master-Switch</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Control which columns are masked before data reaches the Citizen Lab. All changes are logged to the audit trail.
            </p>
            <div className="space-y-2">
              {mergedPrivacyConfigs.map(col => (
                <div key={col.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
                  <div className="flex items-center gap-3">
                    {col.is_masked ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-emerald-600" />}
                    <span className="text-sm font-medium text-foreground">{col.label}</span>
                    <select
                      value={col.mask_type}
                      onChange={e => handleMaskTypeChange(col, e.target.value)}
                      className="rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      {MASK_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <button
                    onClick={() => handleTogglePrivacy(col)}
                    className={`flex items-center gap-1.5 text-xs font-semibold ${col.is_masked ? 'text-muted-foreground' : 'text-emerald-600'}`}
                  >
                    {col.is_masked ? <ToggleLeft className="h-6 w-6" /> : <ToggleRight className="h-6 w-6" />}
                    {col.is_masked ? 'Masked' : 'Exposed'}
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-800">Compliant with the Kenya Data Protection Act (KDPA) 2019.</p>
            </div>
          </motion.div>
        )}

        {activeTab === 'routing' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileCheck className="h-5 w-5 text-amber-600" />
              <h2 className="font-heading font-bold text-foreground">Sovereign Routing Queue</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Provide the Sovereign Handshake to approve reports for public release.
            </p>
            <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-thin">
              {reports.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">No reports in queue.</p>
              ) : reports.map(item => (
                <div key={item.id} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-foreground truncate">{item.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.sector} · {formatRelativeTime(item.created_at)}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded shrink-0 ${
                      item.status === 'approved' ? 'bg-emerald-50 text-emerald-600'
                      : item.status === 'routed' ? 'bg-blue-50 text-blue-600'
                      : 'bg-amber-50 text-amber-600'}`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {item.routed_to ? `Routed to: ${item.routed_to}` : 'Awaiting approval'}
                    </span>
                    {item.status !== 'approved' && item.status !== 'routed' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRejectReport(item)}
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary"
                        >
                          <X className="h-3 w-3" />
                          Reject
                        </button>
                        <button
                          onClick={() => handleApproveReport(item)}
                          className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:shadow-md"
                        >
                          <Send className="h-3 w-3" />
                          Approve & Route
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'dsar' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <UserCog className="h-5 w-5 text-amber-600" />
                <h2 className="font-heading font-bold text-foreground">Data Subject Access Requests</h2>
              </div>
              <button
                onClick={() => setShowDSARForm(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:shadow-lg"
              >
                <Plus className="h-4 w-4" />
                New DSAR
              </button>
            </div>
            <div className="space-y-3">
              {dsarRequests.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
                  No data subject access requests filed.
                </div>
              ) : dsarRequests.map(dsr => (
                <div key={dsr.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase text-amber-600">{dsr.request_type}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          dsr.status === 'completed' ? 'bg-emerald-50 text-emerald-600'
                          : dsr.status === 'rejected' ? 'bg-red-50 text-red-600'
                          : dsr.status === 'in_review' ? 'bg-blue-50 text-blue-600'
                          : 'bg-amber-50 text-amber-600'}`}>
                          {dsr.status}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{dsr.requester_name}</p>
                      <p className="text-xs text-muted-foreground">{dsr.requester_email}</p>
                      {dsr.description && <p className="text-xs text-muted-foreground mt-1">{dsr.description}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">Filed {formatRelativeTime(dsr.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <select
                        value={dsr.status}
                        onChange={e => handleUpdateDSARStatus(dsr, e.target.value)}
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        {DSAR_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                      </select>
                      <button
                        onClick={() => handleDeleteDSAR(dsr)}
                        className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'retention' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ScrollText className="h-5 w-5 text-amber-600" />
                <h2 className="font-heading font-bold text-foreground">Data Retention Policies</h2>
              </div>
              <button
                onClick={() => setShowRetentionPolicyForm(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:shadow-lg"
              >
                <Plus className="h-4 w-4" />
                New Policy
              </button>
            </div>
            <div className="space-y-3">
              {retentionPolicies.length === 0 ? (
                <div className="rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted-foreground">
                  No retention policies configured. Add rules to enforce KDPA-compliant data lifecycle.
                </div>
              ) : retentionPolicies.map(policy => (
                <div key={policy.id} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database className="h-5 w-5 text-amber-600" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{policy.table_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {policy.retention_days} days · {policy.action} · {policy.description || 'No description'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleRetentionPolicy(policy)}
                      className={`flex items-center gap-1.5 text-xs font-semibold ${policy.is_active ? 'text-emerald-600' : 'text-muted-foreground'}`}
                    >
                      {policy.is_active ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                      {policy.is_active ? 'Active' : 'Disabled'}
                    </button>
                    <button
                      onClick={() => handleDeleteRetentionPolicy(policy)}
                      className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'audit' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <Activity className="h-4 w-4 text-amber-600" />
              <h2 className="text-sm font-semibold text-foreground">Recent Audit Trail</h2>
              <span className="text-xs text-muted-foreground ml-auto">SHA-256 verified</span>
            </div>
            <div className="max-h-[500px] overflow-y-auto scrollbar-thin">
              {auditLogs.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                  No audit logs accessible. Super Admin access required.
                </div>
              ) : auditLogs.map(log => (
                <div key={log.id} className="px-4 py-3 border-b border-border/50 last:border-0 hover:bg-secondary/30">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        log.action === 'delete' ? 'bg-red-50 text-red-600'
                        : log.action === 'edit' ? 'bg-amber-50 text-amber-600'
                        : log.action === 'upload' ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-secondary text-muted-foreground'}`}>
                        {log.action}
                      </span>
                      <span className="text-xs font-medium text-foreground">{log.target_entity}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{formatRelativeTime(log.created_at)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{log.details}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground">{log.user_email}</span>
                    {log.sha256_hash && (
                      <span className="text-[10px] font-mono text-amber-600/60">{log.sha256_hash.substring(0, 16)}…</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* DSAR Form Dialog */}
      {showDSARForm && (
        <DSARFormDialog onClose={() => setShowDSARForm(false)} onSave={handleCreateDSAR} />
      )}

      {/* Retention Policy Form Dialog */}
      {showRetentionPolicyForm && (
        <RetentionPolicyDialog onClose={() => setShowRetentionPolicyForm(false)} onSave={handleCreateRetentionPolicy} />
      )}
    </TooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// DSAR Form Dialog
// ---------------------------------------------------------------------------
function DSARFormDialog({ onClose, onSave }) {
  const [form, setForm] = useState({
    request_type: 'access',
    requester_name: '',
    requester_email: '',
    requester_id: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.requester_name || !form.requester_email) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-lg text-foreground">New Data Subject Request</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Request Type *</label>
            <select
              value={form.request_type}
              onChange={e => setForm({ ...form, request_type: e.target.value })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500"
            >
              {DSAR_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Full Name *</label>
              <input type="text" value={form.requester_name} onChange={e => setForm({ ...form, requester_name: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Email *</label>
              <input type="email" value={form.requester_email} onChange={e => setForm({ ...form, requester_email: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">National ID / Identifier</label>
            <input type="text" value={form.requester_id} onChange={e => setForm({ ...form, requester_id: e.target.value })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3} className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:shadow-lg">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Submit Request
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Retention Policy Form Dialog
// ---------------------------------------------------------------------------
function RetentionPolicyDialog({ onClose, onSave }) {
  const [form, setForm] = useState({
    table_name: 'indicators',
    retention_days: 365,
    action: 'archive',
    description: '',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  const TABLES = ['indicators', 'ward_data', 'data_ingestion_jobs', 'data_connectors', 'report_drafts', 'citizen_feedback', 'audit_logs', 'copilot_conversations'];
  const ACTIONS = ['archive', 'delete', 'anonymize'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ ...form, retention_days: parseInt(form.retention_days, 10) });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-lg text-foreground">New Retention Policy</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Table *</label>
            <select value={form.table_name} onChange={e => setForm({ ...form, table_name: e.target.value })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500">
              {TABLES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Retention (days) *</label>
              <input type="number" value={form.retention_days} onChange={e => setForm({ ...form, retention_days: e.target.value })}
                min="1" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Action *</label>
              <select value={form.action} onChange={e => setForm({ ...form, action: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500">
                {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Description</label>
            <input type="text" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Archive indicators after 1 year"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:shadow-lg">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Create Policy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}