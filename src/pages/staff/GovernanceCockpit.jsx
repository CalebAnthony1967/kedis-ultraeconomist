import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Minus, FileCheck, Send, Clock,
  Database, AlertTriangle, CheckCircle2, Users, Activity,
  Target, Globe2, BarChart3, Loader2, Building2, Award
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, PolarAngleAxis
} from 'recharts';

const VISION_2030_PILLARS = [
  { name: 'Economic', score: 68, color: '#10b981' },
  { name: 'Social', score: 54, color: '#f59e0b' },
  { name: 'Governance', score: 72, color: '#3b82f6' },
  { name: 'Infrastructure', score: 61, color: '#8b5cf6' },
];

const SILO_BREAKERS = [
  { agency: 'KNBS', shared: 92, status: 'good' },
  { agency: 'Central Bank', shared: 88, status: 'good' },
  { agency: 'National Treasury', shared: 85, status: 'good' },
  { agency: 'Ministry of Health', shared: 48, status: 'risk' },
  { agency: 'Ministry of Education', shared: 62, status: 'warning' },
  { agency: 'County Govts (avg)', shared: 55, status: 'warning' },
  { agency: 'KRA', shared: 78, status: 'good' },
  { agency: 'EACC', shared: 32, status: 'risk' },
];

const trendData = [
  { year: '2020', gdp: -0.3, inflation: 5.4 },
  { year: '2021', gdp: 7.5, inflation: 6.1 },
  { year: '2022', gdp: 4.8, inflation: 7.7 },
  { year: '2023', gdp: 5.4, inflation: 7.6 },
  { year: '2024', gdp: 5.6, inflation: 5.8 },
  { year: '2025', gdp: 6.1, inflation: 5.2 },
];

export default function GovernanceCockpit() {
  const { lang } = useLanguage();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await base44.entities.ReportDraft.list('-created_date', 10);
        setReports(data || []);
      } catch (e) {}
      setLoading(false);
    }
    load();
  }, []);

  const avgScore = Math.round(VISION_2030_PILLARS.reduce((a, p) => a + p.score, 0) / VISION_2030_PILLARS.length);
  const goodAgencies = SILO_BREAKERS.filter(a => a.status === 'good').length;
  const riskAgencies = SILO_BREAKERS.filter(a => a.status === 'risk').length;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-2">
          <Award className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-foreground">
            {lang === 'sw' ? 'Cockpit ya Utawala' : 'Governance Cockpit'}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {lang === 'sw'
            ? 'Maamuzi ya kasi ya juu — Jumuiya ya Vision 2030 na Agenda 2063.'
            : 'High-velocity decision making — Vision 2030 & AU Agenda 2063 progress.'}
        </p>
      </motion.div>

      {/* National Pulse Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: lang === 'sw' ? 'Alama ya Vision 2030' : 'Vision 2030 Score', value: `${avgScore}%`, icon: Target, color: 'text-primary' },
          { label: lang === 'sw' ? 'Maafisa Shirikishi' : 'Agencies Sharing', value: `${goodAgencies}/${SILO_BREAKERS.length}`, icon: Building2, color: 'text-emerald-600' },
          { label: lang === 'sw' ? 'Madaraja ya Hatari' : 'Data Silos', value: riskAgencies, icon: AlertTriangle, color: 'text-red-600' },
          { label: lang === 'sw' ? 'Ripoti Zilizoidhinishwa' : 'Reports Approved', value: reports.filter(r => r.status === 'approved').length, icon: FileCheck, color: 'text-blue-600' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <stat.icon className={`h-5 w-5 ${stat.color} mb-2`} />
            <div className="font-display text-2xl lg:text-3xl font-extrabold text-foreground">{stat.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Vision 2030 Radial */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            {lang === 'sw' ? 'Matarajio ya Vision 2030' : 'Vision 2030 Pillars'}
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadialBarChart innerRadius="30%" outerRadius="100%" data={VISION_2030_PILLARS} startAngle={90} endAngle={-270}>
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar background dataKey="score" cornerRadius={8} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(150 15% 90%)', fontSize: '12px' }} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {VISION_2030_PILLARS.map((p, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-muted-foreground">{p.name}</span>
                <span className="font-bold text-foreground ml-auto">{p.score}%</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* GDP Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            {lang === 'sw' ? 'Mwenendo wa GDP' : 'GDP & Inflation Trend'}
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="gdpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(150 15% 90%)" />
              <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'hsl(155 10% 40%)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(155 10% 40%)' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(150 15% 90%)', fontSize: '12px' }} />
              <Area type="monotone" dataKey="gdp" name="GDP Growth %" stroke="#10b981" strokeWidth={2} fill="url(#gdpGrad)" />
              <Area type="monotone" dataKey="inflation" name="Inflation %" stroke="#f59e0b" strokeWidth={2} fill="none" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Silo-Breaker Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-border bg-card p-5"
        >
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            {lang === 'sw' ? 'Kuvunja Madaraja' : 'Silo-Breaker Overview'}
          </h3>
          <div className="space-y-2.5 max-h-[220px] overflow-y-auto scrollbar-thin">
            {SILO_BREAKERS.map((agency, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-foreground">{agency.agency}</span>
                  <span className={`font-bold ${
                    agency.status === 'good' ? 'text-emerald-600' :
                    agency.status === 'warning' ? 'text-amber-600' : 'text-red-600'
                  }`}>{agency.shared}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      agency.status === 'good' ? 'bg-emerald-500' :
                      agency.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${agency.shared}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Executive Approval Pipeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border border-border bg-card p-6"
      >
        <h3 className="font-heading font-bold text-foreground mb-4 flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-primary" />
          {lang === 'sw' ? 'Foleni ya Idhini ya Utendaji' : 'Executive Approval Pipeline'}
        </h3>
        {loading ? (
          <div className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary mx-auto" /></div>
        ) : reports.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">
            {lang === 'sw' ? 'Hakuna ripoti kwenye foleni.' : 'No reports pending approval.'}
          </p>
        ) : (
          <div className="space-y-3">
            {reports.map((report, i) => (
              <div key={report.id || i} className="flex items-center justify-between rounded-lg border border-border p-4">
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-foreground truncate">{report.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {report.sector} · {report.status === 'approved' ? (lang === 'sw' ? 'Imeidhinishwa' : 'Approved') : (lang === 'sw' ? 'Inasubiri' : 'Pending')}
                  </p>
                </div>
                {report.status !== 'approved' && (
                  <button
                    onClick={async () => {
                      try {
                        await base44.entities.ReportDraft.update(report.id, { status: 'approved', routed_to: 'President\'s Office' });
                        setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'approved' } : r));
                      } catch (e) {}
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:shadow-md"
                  >
                    <Send className="h-3.5 w-3.5" />
                    {lang === 'sw' ? 'Idhinisha na Elekeza' : 'Sign & Route'}
                  </button>
                )}
                {report.status === 'approved' && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                )}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}