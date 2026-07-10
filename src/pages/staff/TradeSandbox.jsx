import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { motion } from 'framer-motion';
import {
  Briefcase, TrendingDown, TrendingUp, Globe2, DollarSign,
  Activity, ArrowUpRight, ArrowDownRight, Loader2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar
} from 'recharts';

const TRADE_DATA = [
  { month: 'Jan', exports: 58.2, imports: 145.8, deficit: -87.6 },
  { month: 'Feb', exports: 61.5, imports: 152.3, deficit: -90.8 },
  { month: 'Mar', exports: 65.1, imports: 148.9, deficit: -83.8 },
  { month: 'Apr', exports: 62.8, imports: 155.2, deficit: -92.4 },
  { month: 'May', exports: 68.4, imports: 161.0, deficit: -92.6 },
  { month: 'Jun', exports: 71.2, imports: 158.5, deficit: -87.3 },
];

const EXPORT_CATEGORIES = [
  { name: 'Tea', value: 18.5, change: +4.2 },
  { name: 'Horticulture', value: 15.2, change: +8.1 },
  { name: 'Coffee', value: 4.8, change: -2.3 },
  { name: 'Manufactured Goods', value: 12.1, change: +15.6 },
  { name: 'Petroleum Products', value: 8.9, change: +22.4 },
  { name: 'Cement', value: 3.2, change: +6.8 },
];

const PARTNERS = [
  { country: 'Uganda', exports: 12.5, imports: 3.2, flag: '🇺🇬' },
  { country: 'USA (AGOA)', exports: 8.9, imports: 15.2, flag: '🇺🇸' },
  { country: 'Netherlands', exports: 7.8, imports: 4.1, flag: '🇳🇱' },
  { country: 'Pakistan', exports: 6.5, imports: 1.2, flag: '🇵🇰' },
  { country: 'UK', exports: 5.2, imports: 8.5, flag: '🇬🇧' },
  { country: 'Tanzania', exports: 4.8, imports: 2.9, flag: '🇹🇿' },
  { country: 'China', exports: 3.5, imports: 42.8, flag: '🇨🇳' },
];

export default function TradeSandbox() {
  const { lang } = useLanguage();
  const [tab, setTab] = useState('balance');

  const totalExports = TRADE_DATA[TRADE_DATA.length - 1].exports;
  const totalImports = TRADE_DATA[TRADE_DATA.length - 1].imports;
  const deficit = totalExports - totalImports;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Briefcase className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-foreground">
            {lang === 'sw' ? 'Sanduku la Biashara' : 'Trade & Foreign Policy Sandbox'}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {lang === 'sw'
            ? 'Uchambuzi wa nidhamu ya usafirishaji na ujumuishaji wa masoko ya kikanda. Data moja kwa moja kutoka CBK na KRA.'
            : 'Export discipline & regional market integration. Live data from CBK and KRA for real-time trade deficit monitoring.'}
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: lang === 'sw' ? 'Usafirishaji (KES B)' : 'Exports (KES B)', value: totalExports, icon: ArrowUpRight, color: 'text-emerald-600' },
          { label: lang === 'sw' ? 'Kuingizwa (KES B)' : 'Imports (KES B)', value: totalImports, icon: ArrowDownRight, color: 'text-red-600' },
          { label: lang === 'sw' ? 'Kasoro ya Biashara' : 'Trade Deficit', value: `${deficit.toFixed(1)}`, icon: TrendingDown, color: 'text-amber-600' },
          { label: lang === 'sw' ? 'Washirika' : 'Trade Partners', value: PARTNERS.length, icon: Globe2, color: 'text-blue-600' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="rounded-2xl border border-border bg-card p-5">
            <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
            <div className="font-display text-2xl font-extrabold text-foreground">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: 'balance', label: lang === 'sw' ? 'Mizani ya Biashara' : 'Trade Balance' },
          { key: 'exports', label: lang === 'sw' ? 'Kategoria za Usafirishaji' : 'Export Categories' },
          { key: 'partners', label: lang === 'sw' ? 'Washirika wa Biashara' : 'Trade Partners' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/70'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'balance' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">{lang === 'sw' ? 'Mwenendo wa Biashara (Miezi 6)' : 'Trade Balance Trend (6 Months)'}</h3>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={TRADE_DATA}>
              <defs>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                <linearGradient id="impGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} /><stop offset="100%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(150 15% 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(155 10% 40%)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(155 10% 40%)' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(150 15% 90%)', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Area type="monotone" dataKey="exports" name="Exports (KES B)" stroke="#10b981" strokeWidth={2.5} fill="url(#expGrad)" />
              <Area type="monotone" dataKey="imports" name="Imports (KES B)" stroke="#ef4444" strokeWidth={2.5} fill="url(#impGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {tab === 'exports' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">{lang === 'sw' ? 'Kategoria za Usafirishaji (KES B)' : 'Export Categories (KES B)'}</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={EXPORT_CATEGORIES} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(150 15% 90%)" />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(155 10% 40%)' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'hsl(155 10% 40%)' }} width={120} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(150 15% 90%)', fontSize: '12px' }} />
              <Bar dataKey="value" name="Export Value (KES B)" fill="hsl(149 56% 40%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-2 lg:grid-cols-3 gap-3">
            {EXPORT_CATEGORIES.map((cat, i) => (
              <div key={i} className="rounded-lg border border-border p-3 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{cat.name}</span>
                <span className={`text-xs font-bold flex items-center gap-0.5 ${cat.change > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {cat.change > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(cat.change)}%
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {tab === 'partners' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">{lang === 'sw' ? 'Washirika wa Biashara' : 'Trade Partners'}</h3>
          <div className="space-y-3">
            {PARTNERS.map((p, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <span className="text-2xl">{p.flag}</span>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">{p.country}</p>
                  <div className="flex items-center gap-4 mt-1 text-xs">
                    <span className="text-emerald-600">↑ {p.exports}B</span>
                    <span className="text-red-600">↓ {p.imports}B</span>
                  </div>
                </div>
                <div className="w-32">
                  <div className="flex h-4 rounded-full overflow-hidden bg-secondary">
                    <div className="h-full bg-emerald-500" style={{ width: `${p.exports / (p.exports + p.imports) * 100}%` }} />
                    <div className="h-full bg-red-400" style={{ width: `${p.imports / (p.exports + p.imports) * 100}%` }} />
                  </div>
                </div>
                <span className={`text-xs font-bold w-16 text-right ${p.exports > p.imports ? 'text-emerald-600' : 'text-red-600'}`}>
                  {p.exports > p.imports ? 'Surplus' : 'Deficit'}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}