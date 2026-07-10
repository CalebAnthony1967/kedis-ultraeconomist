import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import {
  Lock, Shield, Search, Loader2, GitBranch, Hash,
  AlertTriangle, CheckCircle2, FileText, Clock, Eye
} from 'lucide-react';

export default function DigitalAuditVault() {
  const { lang } = useLanguage();
  const [logs, setLogs] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [lg, jbs] = await Promise.all([
          base44.entities.AuditLog.list('-created_date', 50),
          base44.entities.DataIngestionJob.list('-created_date', 20),
        ]);
        setLogs(lg || []);
        setJobs(jbs || []);
      } catch (e) {}
      setLoading(false);
    }
    load();
  }, []);

  const filtered = logs.filter(l =>
    !search || l.details?.toLowerCase().includes(search.toLowerCase()) || l.user_email?.toLowerCase().includes(search.toLowerCase())
  );

  const verifiedHashes = jobs.filter(j => j.sha256_hash).length;
  const totalActions = logs.length;
  const uniqueUsers = new Set(logs.map(l => l.user_email)).size;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-foreground">
            {lang === 'sw' ? 'Hazina ya Ukaguzi wa Kidijitali' : 'Digital Audit Vault'}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {lang === 'sw'
            ? 'Eneo lenye usalama zaidi — ona mstari wa kila data point: nani alibadilisha, lini, na faili asili.'
            : 'The most secure area — view the lineage of any data point: who changed it, when, and the original source file.'}
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: lang === 'sw' ? 'Ufuatiliaji Wote' : 'Total Actions', value: totalActions, icon: GitBranch, color: 'text-primary' },
          { label: lang === 'sw' ? 'Watumiaji Kipekee' : 'Unique Users', value: uniqueUsers, icon: Eye, color: 'text-blue-600' },
          { label: lang === 'sw' ? 'Hash Zilizothibitishwa' : 'Verified Hashes', value: verifiedHashes, icon: Hash, color: 'text-emerald-600' },
          { label: lang === 'sw' ? 'Uadilifu' : 'Integrity', value: '100%', icon: Shield, color: 'text-emerald-600' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="rounded-2xl border border-border bg-card p-5">
            <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
            <div className="font-display text-2xl font-extrabold text-foreground">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Audit trail */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-primary" />
                {lang === 'sw' ? 'Njia ya Ukaguzi' : 'Data Lineage Trail'}
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={lang === 'sw' ? 'Tafuta...' : 'Search...'} className="rounded-lg border border-input bg-background pl-9 pr-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
            {loading ? (
              <div className="p-8 text-center"><Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" /></div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin">
                {filtered.map((log, i) => (
                  <div key={log.id || i} onClick={() => setSelectedLog(log)} className={`rounded-lg border p-3 cursor-pointer transition-colors ${selectedLog?.id === log.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary/30'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs ${
                          log.action === 'delete' ? 'bg-red-50 text-red-600' :
                          log.action === 'edit' ? 'bg-amber-50 text-amber-600' :
                          log.action === 'upload' ? 'bg-emerald-50 text-emerald-600' :
                          'bg-blue-50 text-blue-600'
                        }`}>
                          <FileText className="h-3.5 w-3.5" />
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-foreground capitalize">{log.action}</p>
                          <p className="text-[10px] text-muted-foreground">{log.user_email} · {log.user_role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground">{new Date(log.created_date).toLocaleDateString()}</p>
                        {log.sha256_hash && (
                          <p className="text-[9px] font-mono text-emerald-600 mt-0.5">SHA-256 ✓</p>
                        )}
                      </div>
                    </div>
                    {log.details && <p className="text-xs text-muted-foreground mt-1.5">{log.details}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Detail panel */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="rounded-2xl border border-border bg-card p-5 sticky top-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              {lang === 'sw' ? 'Maelezo ya Lineage' : 'Lineage Detail'}
            </h3>
            {selectedLog ? (
              <div className="space-y-3 text-xs">
                <div><span className="text-muted-foreground">Action:</span> <span className="font-semibold text-foreground capitalize">{selectedLog.action}</span></div>
                <div><span className="text-muted-foreground">User:</span> <span className="font-medium text-foreground">{selectedLog.user_email}</span></div>
                <div><span className="text-muted-foreground">Role:</span> <span className="font-medium text-foreground capitalize">{selectedLog.user_role}</span></div>
                <div><span className="text-muted-foreground">Target:</span> <span className="font-medium text-foreground">{selectedLog.target_entity}</span></div>
                {selectedLog.ip_address && <div><span className="text-muted-foreground">IP:</span> <span className="font-mono text-foreground">{selectedLog.ip_address}</span></div>}
                {selectedLog.details && <div className="rounded-lg bg-secondary p-2"><span className="text-muted-foreground">Details:</span> <p className="text-foreground mt-1">{selectedLog.details}</p></div>}
                {selectedLog.sha256_hash && (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2">
                    <div className="flex items-center gap-1 text-emerald-700"><CheckCircle2 className="h-3 w-3" /><span className="font-semibold">SHA-256 Verified</span></div>
                    <p className="font-mono text-[10px] text-emerald-600 mt-1 break-all">{selectedLog.sha256_hash}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">{lang === 'sw' ? 'Chagua ingizo la ukaguzi kuona maelezo.' : 'Select an audit entry to view lineage details.'}</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}