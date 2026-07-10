import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, TrendingDown, AlertTriangle,
  Wallet, PieChart as PieIcon, Target, CheckCircle2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const BUDGET_DATA = [
  { quarter: 'Q1', planned: 85, actual: 78 },
  { quarter: 'Q2', planned: 92, actual: 88 },
  { quarter: 'Q3', planned: 88, actual: 71 },
  { quarter: 'Q4', planned: 95, actual: 82 },
];

const ALLOCATION = [
  { name: 'Research Programs', value: 42, color: '#10b981' },
  { name: 'Training & Capacity', value: 18, color: '#3b82f6' },
  { name: 'Administration', value: 22, color: '#f59e0b' },
  { name: 'Infrastructure', value: 12, color: '#8b5cf6' },
  { name: 'International Partnerships', value: 6, color: '#06b6d4' },
];

const ALERTS = [
  { project: 'Macroeconomic Modeling Lab', issue: 'Spending at 85% but milestone at 60%', severity: 'high' },
  { project: 'County Training Program', issue: 'Underspent by 32% — risk of reallocation', severity: 'medium' },
  { project: 'SDG Reporting System', issue: 'On track — 92% alignment', severity: 'low' },
];

export default function FiscalOversight() {
  const { lang } = useLanguage();

  const totalBudget = ALLOCATION.reduce((a, b) => a + b.value, 0);
  const executionRate = Math.round((BUDGET_DATA.reduce((a, b) => a + b.actual, 0) / BUDGET_DATA.reduce((a, b) => a + b.planned, 0)) * 100);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-foreground">
            {lang === 'sw' ? 'Seti ya Ufuatiliaji wa Fedha' : 'Fiscal Oversight Suite'}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {lang === 'sw'
            ? 'Ufuatiliaji wa utekelezaji wa bajeti na arifa otomatiki kama matumizi hayalingani na hatua.'
            : 'Budget execution monitoring with automated alerts when spending misaligns with research milestones.'}
        </p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: lang === 'sw' ? 'Bajeti (KES M)' : 'Total Budget (KES M)', value: totalBudget, icon: Wallet, color: 'text-primary' },
          { label: lang === 'sw' ? 'Kiwango cha Utekelezaji' : 'Execution Rate', value: `${executionRate}%`, icon: TrendingUp, color: 'text-emerald-600' },
          { label: lang === 'sw' ? 'Arifa za Hatari' : 'High Alerts', value: ALERTS.filter(a => a.severity === 'high').length, icon: AlertTriangle, color: 'text-red-600' },
          { label: lang === 'sw' ? 'Mradi Kwenye Njia' : 'On Track', value: ALERTS.filter(a => a.severity === 'low').length, icon: CheckCircle2, color: 'text-emerald-600' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="rounded-2xl border border-border bg-card p-5">
            <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
            <div className="font-display text-2xl font-extrabold text-foreground">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Budget execution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">{lang === 'sw' ? 'Utekelezaji wa Bajeti (KES M)' : 'Budget Execution (KES M)'}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={BUDGET_DATA}>
              <defs>
                <linearGradient id="planGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="100%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(150 15% 90%)" />
              <XAxis dataKey="quarter" tick={{ fontSize: 12, fill: 'hsl(155 10% 40%)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(155 10% 40%)' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(150 15% 90%)', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area type="monotone" dataKey="planned" name="Planned" stroke="#3b82f6" strokeWidth={2.5} fill="url(#planGrad)" />
              <Area type="monotone" dataKey="actual" name="Actual" stroke="#10b981" strokeWidth={2.5} fill="url(#actGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Allocation pie */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <PieIcon className="h-4 w-4 text-primary" />
            {lang === 'sw' ? 'Mgawanyo wa Bajeti' : 'Budget Allocation'}
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={ALLOCATION} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}>
                {ALLOCATION.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(150 15% 90%)', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Alerts */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6 rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          {lang === 'sw' ? 'Arifa za Ufuatiliaji' : 'Milestone Alignment Alerts'}
        </h3>
        <div className="space-y-3">
          {ALERTS.map((alert, i) => (
            <div key={i} className={`rounded-lg border p-4 flex items-center justify-between ${
              alert.severity === 'high' ? 'border-red-200 bg-red-50' :
              alert.severity === 'medium' ? 'border-amber-200 bg-amber-50' :
              'border-emerald-200 bg-emerald-50'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                  alert.severity === 'high' ? 'bg-red-100 text-red-600' :
                  alert.severity === 'medium' ? 'bg-amber-100 text-amber-600' :
                  'bg-emerald-100 text-emerald-600'
                }`}>
                  {alert.severity === 'low' ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{alert.project}</p>
                  <p className="text-xs text-muted-foreground">{alert.issue}</p>
                </div>
              </div>
              <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                alert.severity === 'high' ? 'bg-red-100 text-red-700' :
                alert.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                'bg-emerald-100 text-emerald-700'
              }`}>{alert.severity}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}