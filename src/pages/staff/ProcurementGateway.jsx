import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { motion } from 'framer-motion';
import {
  ShoppingCart, Search, TrendingDown, CheckCircle2, Clock,
  DollarSign, FileText, Award, AlertTriangle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const PROCUREMENTS = [
  { id: 'PRC-2025-001', item: 'Econometric Software Licenses', dept: 'Economic Management', value: 4.5, status: 'approved', vfm: 92 },
  { id: 'PRC-2025-002', item: 'Field Survey Tablets (200 units)', dept: 'Social Sector', value: 8.2, status: 'in_progress', vfm: 78 },
  { id: 'PRC-2025-003', item: 'Cloud Infrastructure (G-Cloud)', dept: 'ICT', value: 12.0, status: 'approved', vfm: 95 },
  { id: 'PRC-2025-004', item: 'Research Consulting Services', dept: 'Governance', value: 6.8, status: 'pending', vfm: 65 },
  { id: 'PRC-2025-005', item: 'Training Venue & Catering', dept: 'Corporate Services', value: 2.3, status: 'approved', vfm: 82 },
  { id: 'PRC-2025-006', item: 'Satellite Imagery License', dept: 'Integrated Development', value: 3.5, status: 'in_progress', vfm: 88 },
];

const VFM_DATA = [
  { dept: 'Economic', avgVfm: 92 },
  { dept: 'Social', avgVfm: 78 },
  { dept: 'ICT', avgVfm: 95 },
  { dept: 'Governance', avgVfm: 65 },
  { dept: 'Corporate', avgVfm: 82 },
  { dept: 'Dev Lab', avgVfm: 88 },
];

export default function ProcurementGateway() {
  const { lang } = useLanguage();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = PROCUREMENTS.filter(p =>
    (!search || p.item.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter === 'all' || p.status === statusFilter)
  );

  const totalValue = PROCUREMENTS.reduce((a, p) => a + p.value, 0);
  const approved = PROCUREMENTS.filter(p => p.status === 'approved').length;
  const avgVfm = Math.round(PROCUREMENTS.reduce((a, p) => a + p.vfm, 0) / PROCUREMENTS.length);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <ShoppingCart className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-foreground">
            {lang === 'sw' ? 'Lango ya Ununuzi' : 'Procurement Gateway'}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {lang === 'sw'
            ? 'Unganisha mahitaji ya ununuzi na data ya kiuchumi kuhakikisha thamani kwa fedha.'
            : 'Connect procurement needs with wider economic data, ensuring value for money in acquisitions.'}
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: lang === 'sw' ? 'Thamani Jumla (KES M)' : 'Total Value (KES M)', value: totalValue.toFixed(1), icon: DollarSign, color: 'text-primary' },
          { label: lang === 'sw' ? 'Imeidhinishwa' : 'Approved', value: approved, icon: CheckCircle2, color: 'text-emerald-600' },
          { label: lang === 'sw' ? 'Inasubiri' : 'Pending', value: PROCUREMENTS.filter(p => p.status === 'pending').length, icon: Clock, color: 'text-amber-600' },
          { label: lang === 'sw' ? 'Wastani wa VfM' : 'Avg VfM Score', value: `${avgVfm}%`, icon: Award, color: 'text-blue-600' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="rounded-2xl border border-border bg-card p-5">
            <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
            <div className="font-display text-2xl font-extrabold text-foreground">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Procurement list */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3 className="text-sm font-semibold">{lang === 'sw' ? 'Maombi ya Ununuzi' : 'Procurement Requests'}</h3>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={lang === 'sw' ? 'Tafuta...' : 'Search...'} className="rounded-lg border border-input bg-background pl-9 pr-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-input bg-background px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary">
                  <option value="all">{lang === 'sw' ? 'Wote' : 'All'}</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="approved">Approved</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              {filtered.map((p, i) => (
                <div key={i} className="rounded-lg border border-border p-3 hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-muted-foreground">{p.id}</span>
                        <span className="text-sm font-bold text-foreground truncate">{p.item}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.dept} · KES {p.value}M</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1">
                        <span className={`text-xs font-bold ${p.vfm >= 80 ? 'text-emerald-600' : p.vfm >= 60 ? 'text-amber-600' : 'text-red-600'}`}>{p.vfm}%</span>
                      </div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        p.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        p.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>{p.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* VfM chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              {lang === 'sw' ? 'Thamani kwa Fedha' : 'Value for Money by Dept'}
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={VFM_DATA} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(150 15% 90%)" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(155 10% 40%)' }} />
                <YAxis type="category" dataKey="dept" tick={{ fontSize: 10, fill: 'hsl(155 10% 40%)' }} width={70} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(150 15% 90%)', fontSize: '12px' }} />
                <Bar dataKey="avgVfm" name="VfM Score" fill="hsl(149 56% 40%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                {lang === 'sw' ? 'Idara ya Utawala ina alama ya chini ya VfM (65%).' : 'Governance dept has lowest VfM score (65%). Review needed.'}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}