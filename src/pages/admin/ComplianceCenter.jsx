import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import {
  Shield, Lock, Eye, EyeOff, ToggleLeft, ToggleRight, FileCheck,
  AlertTriangle, CheckCircle2, Loader2, FileText, Send, Clock
} from 'lucide-react';

const SENSITIVE_COLUMNS = [
  { name: 'researcher_name', label: 'Researcher Names', exposed: false },
  { name: 'contractor_name', label: 'Project Contractors', exposed: false },
  { name: 'phone_number', label: 'Phone Numbers', exposed: false },
  { name: 'national_id', label: 'National IDs', exposed: false },
  { name: 'salary_data', label: 'Salary Data', exposed: false },
  { name: 'location_precise', label: 'Precise Locations', exposed: true },
];

const ROUTING_QUEUE = [
  { id: 1, title: 'Q4 2025 Macroeconomic Outlook', author: 'Dr. Wanjiru K.', status: 'pending', score: 94 },
  { id: 2, title: 'Agricultural Subsidy Impact Brief', author: 'Eng. Otieno S.', status: 'pending', score: 87 },
  { id: 3, title: 'SDG Progress Mid-Year Review', author: 'Dr. Achieng P.', status: 'approved', score: 96 },
  { id: 4, title: 'County Fiscal Strategy Analysis', author: 'Mr. Kamau T.', status: 'pending', score: 82 },
];

export default function ComplianceCenter() {
  const { lang } = useLanguage();
  const [columns, setColumns] = useState(SENSITIVE_COLUMNS);
  const [routingQueue, setRoutingQueue] = useState(ROUTING_QUEUE);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await base44.entities.ReportDraft.list('-created_date', 20);
        setReports(data || []);
      } catch (e) {}
      setLoading(false);
    }
    load();
  }, []);

  const toggleColumn = (name) => {
    setColumns(prev => prev.map(c => c.name === name ? { ...c, exposed: !c.exposed } : c));
  };

  const handleApprove = async (report) => {
    try {
      await base44.entities.ReportDraft.update(report.id, { status: 'approved', routed_to: 'President\'s Office' });
      setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'approved', routed_to: 'President\'s Office' } : r));
    } catch (e) {}
  };

  const queueItems = reports.length > 0 ? reports : routingQueue;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-6 w-6 text-amber-600" />
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-foreground">
            {lang === 'sw' ? 'Kituo cha Uzingatiaji' : 'Compliance & Privacy Center'}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {lang === 'sw'
            ? 'Udhibiti wa Jumla wa Ufichaji wa KDPA na Mkono wa Sera ya Uelekezo.'
            : 'KDPA Anonymization Engine & Sovereign Routing Control.'}
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Privacy Master-Switch */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-2xl border border-border bg-card p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Lock className="h-5 w-5 text-amber-600" />
            <h2 className="font-heading font-bold text-foreground">
              {lang === 'sw' ? 'Kiolesura cha Ufichaji' : 'Anonymization Master-Switch'}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            {lang === 'sw'
              ? 'Amua ni ngazo zipi zinafichwa kwa umma.'
              : 'Control which columns are masked before data reaches the Citizen Lab.'}
          </p>

          <div className="space-y-2">
            {columns.map(col => (
              <div
                key={col.name}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  {col.exposed ? <Eye className="h-4 w-4 text-emerald-600" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                  <span className="text-sm font-medium text-foreground">{col.label}</span>
                </div>
                <button
                  onClick={() => toggleColumn(col.name)}
                  className={`flex items-center gap-1.5 text-xs font-semibold ${
                    col.exposed ? 'text-emerald-600' : 'text-muted-foreground'
                  }`}
                >
                  {col.exposed ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                  {col.exposed ? (lang === 'sw' ? 'Wazi' : 'Exposed') : (lang === 'sw' ? 'Fichwa' : 'Masked')}
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800">
              {lang === 'sw'
                ? 'Inazingatia sheria ya Kulinda Data ya Kenya (KDPA).'
                : 'Compliant with the Kenya Data Protection Act (KDPA).'}
            </p>
          </div>
        </motion.div>

        {/* Sovereign Routing Queue */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-2xl border border-border bg-card p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <FileCheck className="h-5 w-5 text-amber-600" />
            <h2 className="font-heading font-bold text-foreground">
              {lang === 'sw' ? 'Foleni ya Uelekeo' : 'Sovereign Routing Queue'}
            </h2>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            {lang === 'sw'
              ? 'Toa "Mkono wa Sera" kwa kuruhusu ripoti kwa umma.'
              : 'Provide the Sovereign Handshake to approve reports for public release.'}
          </p>

          <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin">
            {loading ? (
              <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin text-amber-600 mx-auto" /></div>
            ) : queueItems.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                {lang === 'sw' ? 'Hakuna ripoti kwenye foleni.' : 'No reports in queue.'}
              </p>
            ) : (
              queueItems.map((item, i) => (
                <div key={item.id || i} className="rounded-lg border border-border p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-foreground truncate">{item.title}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.author || item.sector || 'KIPPRA Researcher'}
                      </p>
                    </div>
                    {item.score && (
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        item.score >= 90 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {item.score}%
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                      item.status === 'approved' ? 'text-emerald-600' : 'text-amber-600'
                    }`}>
                      {item.status === 'approved' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                      {item.status === 'approved'
                        ? (lang === 'sw' ? 'Imeidhinishwa' : 'Approved')
                        : (lang === 'sw' ? 'Inasubiri' : 'Pending')}
                    </span>
                    {item.status !== 'approved' && (
                      <button
                        onClick={() => handleApprove(item)}
                        className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:shadow-md"
                      >
                        <Send className="h-3 w-3" />
                        {lang === 'sw' ? 'Idhinisha' : 'Approve & Route'}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}