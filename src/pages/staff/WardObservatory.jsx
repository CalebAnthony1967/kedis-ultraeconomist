import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import {
  MapPin, TrendingDown, TrendingUp, Search, Loader2,
  Activity, Users, AlertTriangle
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis
} from 'recharts';

const SAMPLE_WARDS = [
  { ward_name: 'Kibera', county: 'Nairobi', poverty_rate: 78.5, population: 250000, gva: 1200, evi: 0.22 },
  { ward_name: 'Westlands', county: 'Nairobi', poverty_rate: 12.3, population: 85000, gva: 18500, evi: 0.08 },
  { ward_name: 'Kasarani', county: 'Nairobi', poverty_rate: 34.2, population: 180000, gva: 4200, evi: 0.15 },
  { ward_name: 'Mavoko', county: 'Machakos', poverty_rate: 42.1, population: 154000, gva: 3800, evi: 0.18 },
  { ward_name: 'Naivasha', county: 'Nakuru', poverty_rate: 38.7, population: 181000, gva: 5200, evi: 0.31 },
  { ward_name: 'Likoni', county: 'Mombasa', poverty_rate: 51.3, population: 195000, gva: 2800, evi: 0.12 },
  { ward_name: 'Nyeri Central', county: 'Nyeri', poverty_rate: 22.8, population: 98000, gva: 6500, evi: 0.28 },
  { ward_name: 'Bungoma South', county: 'Bungoma', poverty_rate: 48.9, population: 165000, gva: 2100, evi: 0.35 },
  { ward_name: 'Kisumu Central', county: 'Kisumu', poverty_rate: 39.5, population: 175000, gva: 4800, evi: 0.19 },
  { ward_name: 'Garissa Township', county: 'Garissa', poverty_rate: 65.7, population: 145000, gva: 1500, evi: 0.14 },
];

export default function WardObservatory() {
  const { lang } = useLanguage();
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedWard, setSelectedWard] = useState(null);
  const [indicator, setIndicator] = useState('poverty_rate');

  useEffect(() => {
    async function load() {
      try {
        const data = await base44.entities.WardData.list('-created_date', 50);
        if (data && data.length > 0) {
          setWards(data);
        } else {
          setWards(SAMPLE_WARDS);
        }
      } catch (e) {
        setWards(SAMPLE_WARDS);
      }
      setLoading(false);
    }
    load();
  }, []);

  const indicators = [
    { key: 'poverty_rate', label: lang === 'sw' ? 'Kiwango cha Umasikini' : 'Poverty Rate (%)', color: '#ef4444' },
    { key: 'gva', label: lang === 'sw' ? 'Thamani Iliyoongezwa' : 'Gross Value Added (KES M)', color: '#10b981' },
    { key: 'evi', label: lang === 'sw' ? 'Faharasa ya Mimea' : 'Enhanced Vegetation Index', color: '#22c55e' },
    { key: 'population', label: lang === 'sw' ? 'Idadi ya Watu' : 'Population', color: '#3b82f6' },
  ];

  const filtered = wards.filter(w =>
    !search || w.ward_name?.toLowerCase().includes(search.toLowerCase()) || w.county?.toLowerCase().includes(search.toLowerCase())
  );

  const scatterData = filtered.map(w => ({
    name: w.ward_name,
    poverty: w.poverty_rate || 0,
    gva: w.gva || 0,
    population: w.population || 0,
  }));

  const avgPoverty = wards.length > 0 ? (wards.reduce((a, w) => a + (w.poverty_rate || 0), 0) / wards.length).toFixed(1) : 0;
  const highRiskWards = wards.filter(w => (w.poverty_rate || 0) > 50).length;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-foreground">
            {lang === 'sw' ? 'Kituo cha SAE cha Kata' : 'Ward-Level SAE Observatory'}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {lang === 'sw'
            ? 'Makadirio ya Eneo Dogo (SAE) yanayogawa data ya taifa kwa kata 1,450 kwa kutumia data ya satelaiti.'
            : 'Bayesian Small Area Estimation disaggregating national data to 1,450 wards using satellite covariates (EVI, Temperature).'}
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: lang === 'sw' ? 'Wastani wa Umasikini' : 'Avg Poverty Rate', value: `${avgPoverty}%`, icon: TrendingDown, color: 'text-red-600' },
          { label: lang === 'sw' ? 'Kata za Hatari' : 'High-Risk Wards', value: highRiskWards, icon: AlertTriangle, color: 'text-amber-600' },
          { label: lang === 'sw' ? 'Kata Zilizoonyeshwa' : 'Wards Displayed', value: filtered.length, icon: MapPin, color: 'text-primary' },
          { label: lang === 'sw' ? 'Wastani wa EVI' : 'Avg EVI Score', value: (wards.reduce((a, w) => a + (w.evi || 0), 0) / Math.max(wards.length, 1)).toFixed(2), icon: Activity, color: 'text-emerald-600' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="rounded-2xl border border-border bg-card p-5">
            <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
            <div className="font-display text-2xl font-extrabold text-foreground">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Scatter: Poverty vs GVA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">{lang === 'sw' ? 'Umasikini dhidi ya GVA' : 'Poverty vs GVA (SAE Disaggregated)'}</h3>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(150 15% 90%)" />
                <XAxis type="number" dataKey="poverty" name="Poverty %" tick={{ fontSize: 11, fill: 'hsl(155 10% 40%)' }} label={{ value: 'Poverty Rate (%)', position: 'bottom', fontSize: 11, fill: 'hsl(155 10% 40%)' }} />
                <YAxis type="number" dataKey="gva" name="GVA (KES M)" tick={{ fontSize: 11, fill: 'hsl(155 10% 40%)' }} />
                <ZAxis type="number" dataKey="population" range={[60, 400]} name="Population" />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(150 15% 90%)', fontSize: '12px' }} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={scatterData} fill="hsl(149 56% 40%)" />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Bar chart by ward */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">{indicators.find(i => i.key === indicator)?.label}</h3>
            <select
              value={indicator}
              onChange={(e) => setIndicator(e.target.value)}
              className="rounded-lg border border-input bg-background px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-primary"
            >
              {indicators.map(ind => <option key={ind.key} value={ind.key}>{ind.label}</option>)}
            </select>
          </div>
          {loading ? (
            <div className="h-[300px] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={filtered.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(150 15% 90%)" />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(155 10% 40%)' }} />
                <YAxis type="category" dataKey="ward_name" tick={{ fontSize: 10, fill: 'hsl(155 10% 40%)' }} width={80} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(150 15% 90%)', fontSize: '12px' }} />
                <Bar dataKey={indicator} fill={indicators.find(i => i.key === indicator)?.color} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* Ward search & detail */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6 rounded-2xl border border-border bg-card p-5">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === 'sw' ? 'Tafuta kata au kaunti...' : 'Search ward or county...'}
            className="w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-semibold text-muted-foreground">{lang === 'sw' ? 'Kata' : 'Ward'}</th>
                <th className="text-left py-2 px-3 font-semibold text-muted-foreground">{lang === 'sw' ? 'Kaunti' : 'County'}</th>
                <th className="text-right py-2 px-3 font-semibold text-muted-foreground">Poverty %</th>
                <th className="text-right py-2 px-3 font-semibold text-muted-foreground">GVA (KES M)</th>
                <th className="text-right py-2 px-3 font-semibold text-muted-foreground">EVI</th>
                <th className="text-right py-2 px-3 font-semibold text-muted-foreground">{lang === 'sw' ? 'WatU' : 'Pop.'}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 15).map((w, i) => (
                <tr key={i} onClick={() => setSelectedWard(w)} className={`border-b border-border cursor-pointer hover:bg-secondary/30 ${selectedWard?.ward_name === w.ward_name ? 'bg-secondary/50' : ''}`}>
                  <td className="py-2 px-3 font-medium text-foreground">{w.ward_name}</td>
                  <td className="py-2 px-3 text-muted-foreground">{w.county}</td>
                  <td className="py-2 px-3 text-right">
                    <span className={w.poverty_rate > 50 ? 'text-red-600 font-bold' : w.poverty_rate > 30 ? 'text-amber-600' : 'text-emerald-600'}>
                      {w.poverty_rate?.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right text-foreground/80">{w.gva?.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right text-foreground/80">{w.evi?.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right text-foreground/80">{w.population?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}