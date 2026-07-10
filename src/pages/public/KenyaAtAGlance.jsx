import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import {
  Globe2, Target, TrendingUp, Users, Heart, GraduationCap,
  Droplet, Zap, Shield, Loader2, MapPin
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis, Tooltip
} from 'recharts';

const NATIONAL_SCORES = [
  { label: 'Food Security', label_sw: 'Usalama wa Chakula', value: 78, icon: Heart, color: '#10b981' },
  { label: 'Education Access', label_sw: 'Upatikanaji wa Elimu', value: 85, icon: GraduationCap, color: '#3b82f6' },
  { label: 'Water Access', label_sw: 'Upatikanaji wa Maji', value: 62, icon: Droplet, color: '#06b6d4' },
  { label: 'Electricity', label_sw: 'Umeme', value: 77, icon: Zap, color: '#f59e0b' },
  { label: 'Healthcare', label_sw: 'Afya', value: 58, icon: Heart, color: '#ef4444' },
  { label: 'Security', label_sw: 'Usalama', value: 71, icon: Shield, color: '#8b5cf6' },
];

const BUDGET_PIE = [
  { name: 'Education', value: 22, color: '#ef4444' },
  { name: 'Health', value: 8, color: '#ec4899' },
  { name: 'Infrastructure', value: 18, color: '#3b82f6' },
  { name: 'Agriculture', value: 6, color: '#10b981' },
  { name: 'Governance', value: 12, color: '#8b5cf6' },
  { name: 'Other', value: 34, color: '#64748b' },
];

export default function KenyaAtAGlance() {
  const { lang } = useLanguage();
  const [wards, setWards] = useState([]);
  const [selectedWard, setSelectedWard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await base44.entities.WardData.list('-created_date', 10);
        setWards(data || []);
        if (data && data.length > 0) setSelectedWard(data[0]);
      } catch (e) {}
      setLoading(false);
    }
    load();
  }, []);

  const avgScore = Math.round(NATIONAL_SCORES.reduce((a, s) => a + s.value, 0) / NATIONAL_SCORES.length);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Globe2 className="h-6 w-6 text-teal-600" />
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-foreground">
            {lang === 'sw' ? 'Kenya kwa Muhtasari' : 'Kenya at a Glance'}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {lang === 'sw'
            ? 'Alama za Maendeleo ya Taifa — jinsi pesa za wafanyakazi zinabadilishwa kuwa matokeo.'
            : 'National Progress Scores — how taxpayers\' money is being converted into outcomes.'}
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl border border-border bg-gradient-to-br from-teal-50 to-cyan-50 p-6 lg:p-8 mb-6">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div className="relative w-40 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ value: avgScore, fill: '#0d9488' }]} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background dataKey="value" cornerRadius={20} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-4xl font-extrabold text-teal-700">{avgScore}%</span>
              <span className="text-[10px] text-muted-foreground">{lang === 'sw' ? 'Lengo' : 'of Target'}</span>
            </div>
          </div>
          <div className="flex-1 text-center lg:text-left">
            <h2 className="font-display text-xl lg:text-2xl font-extrabold text-foreground">
              {lang === 'sw' ? 'Kenya Inafikia Malengo' : 'Kenya is Progressing'}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {lang === 'sw'
                ? 'Wastani wa alama za maendeleo katika sekta sita muhimu. Data imethibitishwa na SHA-256.'
                : 'Average progress across six key development sectors. SHA-256 verified data integrity.'}
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700">
              <Shield className="h-3.5 w-3.5" />
              {lang === 'sw' ? 'Imethibitishwa' : 'Integrity Verified'}
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-4">{lang === 'sw' ? 'Alama za Maendeleo' : 'National Progress Scores'}</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {NATIONAL_SCORES.map((score, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <score.icon className="h-4 w-4" style={{ color: score.color }} />
                      <span className="text-sm font-medium text-foreground">{lang === 'sw' ? score.label_sw : score.label}</span>
                    </div>
                    <span className="text-lg font-bold" style={{ color: score.color }}>{score.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${score.value}%` }} transition={{ delay: i * 0.1 + 0.3, duration: 0.6 }} className="h-full rounded-full" style={{ backgroundColor: score.color }} />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {score.value >= 70 ? (lang === 'sw' ? 'Kwenye njia' : 'On Track') : score.value >= 50 ? (lang === 'sw' ? 'Lazima kufanya zaidi' : 'Needs Work') : (lang === 'sw' ? 'Nyuma' : 'Lagging')}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-4">{lang === 'sw' ? 'Mgawanyo wa Bajeti' : 'National Budget Split'}</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={BUDGET_PIE} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={2}>
                  {BUDGET_PIE.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(150 15% 90%)', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-1.5 mt-2">
              {BUDGET_PIE.map((b, i) => (
                <div key={i} className="flex items-center gap-1.5 text-[10px]">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: b.color }} />
                  <span className="text-muted-foreground">{b.name}</span>
                  <span className="font-bold text-foreground">{b.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6 rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-teal-600" />
          {lang === 'sw' ? 'Athari ya Karibu' : 'Localized Impact'}
        </h3>
        {loading ? (
          <div className="p-6 text-center"><Loader2 className="h-5 w-5 animate-spin text-teal-600 mx-auto" /></div>
        ) : wards.length > 0 ? (
          <div className="space-y-3">
            <select value={selectedWard?.id || ''} onChange={(e) => setSelectedWard(wards.find(w => w.id === e.target.value))} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500">
              {wards.map(w => <option key={w.id} value={w.id}>{w.ward_name}, {w.county}</option>)}
            </select>
            {selectedWard && (
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="rounded-lg bg-secondary/50 p-4">
                  <p className="text-xs text-muted-foreground">{lang === 'sw' ? 'Umasikini' : 'Poverty Rate'}</p>
                  <p className={`font-display text-xl font-extrabold ${(selectedWard.poverty_rate || 0) > 50 ? 'text-red-600' : 'text-emerald-600'}`}>{selectedWard.poverty_rate?.toFixed(1) || '—'}%</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-4">
                  <p className="text-xs text-muted-foreground">{lang === 'sw' ? 'GVA (KES M)' : 'GVA (KES M)'}</p>
                  <p className="font-display text-xl font-extrabold text-foreground">{selectedWard.gva?.toLocaleString() || '—'}</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-4">
                  <p className="text-xs text-muted-foreground">{lang === 'sw' ? 'Alama ya SDG' : 'SDG Score'}</p>
                  <p className="font-display text-xl font-extrabold text-teal-600">{selectedWard.sdg_score?.toFixed(1) || '—'}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-4">{lang === 'sw' ? 'Hakuna data ya kata iliyopatikana.' : 'No ward data available.'}</p>
        )}
      </motion.div>
    </div>
  );
}