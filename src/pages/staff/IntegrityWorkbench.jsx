import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import {
  Scale, Search, TrendingDown, TrendingUp, AlertTriangle,
  Loader2, FileText, Gavel, ShieldAlert
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis
} from 'recharts';

const GOVERNANCE_DATA = [
  { metric: 'PFM Compliance', score: 68, target: 100, source: 'Treasury / OAG' },
  { metric: 'Corruption Index', score: 32, target: 100, source: 'EACC / TI' },
  { metric: 'Judicial Efficiency', score: 54, target: 100, source: 'Judiciary / Courts' },
  { metric: 'Procurement Transparency', score: 61, target: 100, source: 'PPRA' },
  { metric: 'Budget Transparency', score: 72, target: 100, source: 'IBP / Open Budget' },
  { metric: 'Service Delivery', score: 58, target: 100, source: 'CoG / Citizen Reports' },
];

const CORRUPTION_CASES = [
  { year: 2020, cases: 342, resolved: 128 },
  { year: 2021, cases: 415, resolved: 156 },
  { year: 2022, cases: 388, resolved: 182 },
  { year: 2023, cases: 421, resolved: 195 },
  { year: 2024, cases: 365, resolved: 218 },
];

export default function IntegrityWorkbench() {
  const { lang } = useLanguage();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await base44.entities.CitizenFeedback.list('-created_date', 20);
        setFeedback(data || []);
      } catch (e) {}
      setLoading(false);
    }
    load();
  }, []);

  const redFlags = feedback.filter(f => f.project_status === 'stalled' || f.project_status === 'abandoned');
  const avgScore = Math.round(GOVERNANCE_DATA.reduce((a, g) => a + g.score, 0) / GOVERNANCE_DATA.length);

  const filteredFeedback = feedback.filter(f =>
    !search || f.project_name?.toLowerCase().includes(search.toLowerCase()) || f.ward_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Scale className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-foreground">
            {lang === 'sw' ? 'Meza ya Uadilifu na Maadili' : 'Integrity & Ethics Workbench'}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {lang === 'sw'
            ? 'Uchambuzi wa usimamizi wa fedha za umma, faharasa ya rushwa, na ufanisi wa mahakama.'
            : 'Public finance management, corruption indices, and judicial efficiency data from Courts and EACC.'}
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: lang === 'sw' ? 'Alama ya Utawala' : 'Governance Score', value: `${avgScore}%`, icon: Scale, color: 'text-primary' },
          { label: lang === 'sw' ? 'Bendera Nyekundu' : 'Red Flags', value: redFlags.length, icon: AlertTriangle, color: 'text-red-600' },
          { label: lang === 'sw' ? 'Ripoti za Raia' : 'Citizen Reports', value: feedback.length, icon: FileText, color: 'text-amber-600' },
          { label: lang === 'sw' ? 'Faharasa ya Rushwa' : 'Corruption Index', value: '32/100', icon: ShieldAlert, color: 'text-red-600' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="rounded-2xl border border-border bg-card p-5">
            <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
            <div className="font-display text-2xl font-extrabold text-foreground">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Governance radial */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">{lang === 'sw' ? 'Faharasa za Utawala' : 'Governance Indices'}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadialBarChart innerRadius="20%" outerRadius="100%" data={GOVERNANCE_DATA} startAngle={90} endAngle={-270}>
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar background dataKey="score" cornerRadius={6} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(150 15% 90%)', fontSize: '12px' }} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {GOVERNANCE_DATA.map((g, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{g.metric}</span>
                <span className={`font-bold ${g.score >= 60 ? 'text-emerald-600' : g.score >= 40 ? 'text-amber-600' : 'text-red-600'}`}>{g.score}%</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Corruption cases chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Gavel className="h-4 w-4 text-primary" />
            {lang === 'sw' ? 'Kesi za Rushwa (EACC)' : 'Corruption Cases (EACC)'}
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={CORRUPTION_CASES}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(150 15% 90%)" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'hsl(155 10% 40%)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(155 10% 40%)' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(150 15% 90%)', fontSize: '12px' }} />
              <Bar dataKey="cases" name="Cases Filed" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolved" name="Cases Resolved" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Red flag alerts from citizen feedback */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            {lang === 'sw' ? 'Bendera Nyekundu kutoka kwa Raia' : 'Red Flag Alerts from Citizen Ground-Truthing'}
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={lang === 'sw' ? 'Tafuta...' : 'Search...'} className="rounded-lg border border-input bg-background pl-9 pr-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>
        {loading ? (
          <div className="p-6 text-center"><Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" /></div>
        ) : filteredFeedback.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-6">{lang === 'sw' ? 'Hakuna bendera nyekundu.' : 'No red flags reported.'}</p>
        ) : (
          <div className="space-y-2">
            {filteredFeedback.map((f, i) => (
              <div key={f.id || i} className={`rounded-lg border p-3 ${f.project_status === 'abandoned' ? 'border-red-200 bg-red-50' : f.project_status === 'stalled' ? 'border-amber-200 bg-amber-50' : 'border-border'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-foreground">{f.project_name}</p>
                    <p className="text-xs text-muted-foreground">{f.ward_name}, {f.county}</p>
                  </div>
                  <span className={`text-xs font-bold capitalize px-2 py-1 rounded ${
                    f.project_status === 'abandoned' ? 'bg-red-100 text-red-700' :
                    f.project_status === 'stalled' ? 'bg-amber-100 text-amber-700' :
                    'bg-secondary text-muted-foreground'
                  }`}>{f.project_status.replace('_', ' ')}</span>
                </div>
                {f.status_report && <p className="text-xs text-muted-foreground mt-1.5">{f.status_report}</p>}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}