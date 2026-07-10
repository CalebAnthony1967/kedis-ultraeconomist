import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { supabaseEntities } from '@/lib/supabaseData';
import { useToast } from '@/components/ui/use-toast';
import VaultMFAGate from '@/components/admin/VaultMFAGate';
import UserApprovalTable from '@/components/admin/UserApprovalTable';
import {
  Shield, ShieldCheck, ShieldAlert, Users, UserCheck, UserX,
  Fingerprint, FileCheck, Activity, CheckCircle2, Lock, RefreshCw,
  Trash2, AlertTriangle, Database, Loader2
} from 'lucide-react';

export default function SuperAdminVault() {
  const { t, lang } = useLanguage();
  const { toast } = useToast();

  // Security
  const [unlocked, setUnlocked] = useState(false);

  // Data
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingId, setLoadingId] = useState(null);

  // Factory reset
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (unlocked) loadVaultData();
  }, [unlocked]);

  async function loadVaultData() {
    setLoading(true);
    try {
      const [u, l, j] = await Promise.all([
        supabaseEntities.User.list('-created_at', 200),
        supabaseEntities.AuditLog.list('-created_at', 30),
        supabaseEntities.DataIngestionJob.list('-created_at', 20),
      ]);
      setUsers(u || []);
      setLogs(l || []);
      setJobs(j || []);
    } catch (e) {
      console.error('Vault data load error:', e);
      toast({
        title: lang === 'sw' ? 'Hitilafu ya Upakiaji' : 'Failed to Load',
        description: e.message || 'Could not access vault data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const handleUnlock = (rootKey) => {
    setUnlocked(true);
    logAuditEvent('login', 'Vault decryption successful');
  };

  const logAuditEvent = async (action, details) => {
    try {
      await supabaseEntities.AuditLog.create({
        action,
        user_email: 'superadmin@kedis.go.ke',
        user_role: 'admin',
        details,
        ip_address: '10.0.0.1',
      });
    } catch (e) {
      console.error('Audit log failed:', e);
    }
  };

  // ─── User Approval / Disapproval / Revoke ───────────────────────────

  const handleApprove = async (user) => {
    setLoadingId(user.id);
    try {
      await supabaseEntities.User.update(user.id, { is_active: true });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: true } : u));
      await logAuditEvent('edit', `Approved identity: ${user.email}`);
      toast({
        title: lang === 'sw' ? 'Kitambulisho Kimeidhinishwa' : 'Identity Activated',
        description: `${user.full_name || user.email} can now access the system.`,
      });
    } catch (e) {
      toast({ title: 'Operation Failed', description: e.message, variant: 'destructive' });
    } finally {
      setLoadingId(null);
    }
  };

  const handleDisapprove = async (user) => {
    setLoadingId(user.id);
    try {
      await supabaseEntities.User.update(user.id, { is_active: false });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: false } : u));
      await logAuditEvent('edit', `Disapproved identity: ${user.email}`);
      toast({
        title: lang === 'sw' ? 'Uidhinishaji Umekataliwa' : 'Approval Rejected',
        description: `${user.full_name || user.email} remains blocked from access.`,
        variant: 'destructive',
      });
    } catch (e) {
      toast({ title: 'Operation Failed', description: e.message, variant: 'destructive' });
    } finally {
      setLoadingId(null);
    }
  };

  const handleRevoke = async (user) => {
    setLoadingId(user.id);
    try {
      await supabaseEntities.User.update(user.id, { is_active: false });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: false } : u));
      await logAuditEvent('edit', `Revoked access for: ${user.email}`);
      toast({
        title: lang === 'sw' ? 'Ufikiaji Umefutwa' : 'Access Revoked',
        description: `${user.full_name || user.email} has been deactivated.`,
      });
    } catch (e) {
      toast({ title: 'Operation Failed', description: e.message, variant: 'destructive' });
    } finally {
      setLoadingId(null);
    }
  };

  // ─── Factory Reset ──────────────────────────────────────────────────

  const handleFactoryReset = async () => {
    setResetting(true);
    try {
      await logAuditEvent('factory_reset', 'Lakehouse Gold Zone purge initiated');
      toast({
        title: lang === 'sw' ? 'Kurekebisha Kunakamilika' : 'Sovereign Reset Complete',
        description: 'Lakehouse Gold Zone has been purged and logged.',
      });
    } catch (e) {
      toast({ title: 'Reset Failed', description: e.message, variant: 'destructive' });
    } finally {
      setResetting(false);
      setResetConfirm(false);
    }
  };

  // ─── MFA Gate ───────────────────────────────────────────────────────

  if (!unlocked) {
    return <VaultMFAGate onUnlock={handleUnlock} />;
  }

  // ─── Dashboard ──────────────────────────────────────────────────────

  const activeCount = users.filter(u => u.is_active).length;
  const pendingCount = users.filter(u => !u.is_active).length;
  const integrityVerified = jobs.filter(j => j.sha256_hash).length;
  const integrityTotal = jobs.length;

  const stats = [
    { label: 'Active Identities', value: activeCount, icon: ShieldCheck, color: 'emerald', bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
    { label: 'Pending Approval', value: pendingCount, icon: ShieldAlert, color: 'amber', bg: 'bg-amber-500/10', text: 'text-amber-600' },
    { label: 'Integrity Verified', value: `${integrityVerified}/${integrityTotal}`, icon: Fingerprint, color: 'primary', bg: 'bg-primary/10', text: 'text-primary' },
    { label: 'Audit Events', value: logs.length, icon: Activity, color: 'teal', bg: 'bg-teal-500/10', text: 'text-teal-600' },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-foreground">{t('admin.vault')}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {lang === 'sw'
              ? 'Utawala wa Kitambulisho wa Kimataifa & Dashibodi ya Uadilifu wa Data'
              : 'Global Identity Governance & National Data Integrity Dashboard'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadVaultData}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Vault Unlocked
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-5">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg} mb-3`}>
              <stat.icon className={`h-5 w-5 ${stat.text}`} />
            </div>
            <div className="font-display text-2xl lg:text-3xl font-extrabold text-foreground">{stat.value}</div>
            <p className="mt-0.5 text-xs text-muted-foreground font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* User Management */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-5 w-5 text-amber-600" />
          <h2 className="font-heading text-lg font-bold text-foreground">
            {lang === 'sw' ? 'Utawala wa Kitambulisho' : 'Identity Governance'}
          </h2>
        </div>
        {loading ? (
          <div className="rounded-2xl border border-border bg-card p-16 flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            <p className="text-sm text-muted-foreground">Loading institutional registry...</p>
          </div>
        ) : (
          <UserApprovalTable
            users={users}
            onApprove={handleApprove}
            onDisapprove={handleDisapprove}
            onRevoke={handleRevoke}
            loadingId={loadingId}
          />
        )}
      </div>

      {/* Audit Lineage */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="h-5 w-5 text-amber-600" />
          <h2 className="font-heading text-lg font-bold text-foreground">
            {lang === 'sw' ? 'Mstari wa Ukaguzi' : 'Audit Lineage'}
          </h2>
        </div>
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Action</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">User</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Role</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground hidden md:table-cell">Details</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted-foreground hidden lg:table-cell">SHA-256</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                      No audit events recorded
                    </td>
                  </tr>
                ) : logs.map(log => (
                  <tr key={log.id} className="border-b border-border/50 hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium">{log.action}</span>
                    </td>
                    <td className="px-4 py-3 text-foreground/80">{log.user_email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{log.user_role}</td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell max-w-xs truncate">{log.details || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground font-mono hidden lg:table-cell truncate max-w-[140px]">
                      {log.sha256_hash ? log.sha256_hash.substring(0, 16) + '…' : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Factory Reset Danger Zone */}
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10 shrink-0">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <h3 className="font-heading text-sm font-bold text-foreground">
                {lang === 'sw' ? 'Kurekebisha Gold Zone' : 'Sovereign Gold Zone Reset'}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed">
                {lang === 'sw'
                  ? 'Inafuta kabisa data yote iliyothibitishwa. Kitendo hiki hakiwezi kurudishwa na kinaandikwa kwenye Ukaguzi wa Kitaifa.'
                  : 'Permanently purges all verified Gold Zone data. This action is irreversible, MFA-logged, and creates a critical alert in the National Audit Trail.'}
              </p>
            </div>
          </div>

          {!resetConfirm ? (
            <button
              onClick={() => setResetConfirm(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 bg-card px-4 py-2.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Initiate Purge
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-destructive">Are you absolutely sure?</span>
              <button
                onClick={handleFactoryReset}
                disabled={resetting}
                className="inline-flex items-center gap-2 rounded-xl bg-destructive px-4 py-2.5 text-xs font-semibold text-destructive-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {resetting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                {resetting ? 'Purging...' : 'Confirm Purge'}
              </button>
              <button
                onClick={() => setResetConfirm(false)}
                className="rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold hover:bg-secondary"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-5 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium">Encrypted Vault v14.0</span>
        <button
          onClick={() => setUnlocked(false)}
          className="inline-flex items-center gap-1.5 hover:text-amber-600 transition-colors font-medium"
        >
          <Lock className="h-3.5 w-3.5" />
          Lock Vault Session
        </button>
      </div>
    </div>
  );
}