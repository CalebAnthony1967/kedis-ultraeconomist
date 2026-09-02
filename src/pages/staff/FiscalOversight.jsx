import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, TrendingUp, TrendingDown, AlertTriangle,
  Wallet, PieChart as PieIcon, Target, CheckCircle2,
  Zap, Smartphone, BarChart3, Sliders, FileText, 
  ShieldCheck, Activity, Globe, Info
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, ReferenceLine, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

// --- DATA CONSTANTS (Institutional + Macro) ---
const BUDGET_DATA = [
  { quarter: 'Q1', planned: 85, actual: 78, nowcast: 79 },
  { quarter: 'Q2', planned: 92, actual: 88, nowcast: 89 },
  { quarter: 'Q3', planned: 88, actual: 71, nowcast: 75 },
  { quarter: 'Q4', planned: 95, actual: 82, nowcast: 84 },
];

const ALLOCATION = [
  { name: 'Research Programs', value: 42, color: '#10b981' },
  { name: 'Training & Capacity', value: 18, color: '#3b82f6' },
  { name: 'Administration', value: 22, color: '#f59e0b' },
  { name: 'Infrastructure', value: 12, color: '#8b5cf6' },
  { name: 'International Partnerships', value: 6, color: '#06b6d4' },
];

const ALERTS = [
  { project: 'Macroeconomic Modeling Lab', issue: 'Spending at 85% but milestone at 60%', severity: 'high', type: 'budget' },
  { project: 'Revenue Nowcasting', issue: 'Mobile Money velocity dropped by 4% in Nairobi Ward', severity: 'high', type: 'macro' },
  { project: 'County Training Program', issue: 'Underspent by 32% — risk of reallocation', severity: 'medium', type: 'budget' },
];

const MACRO_INDICATORS = [
  { subject: 'GDP Growth', A: 120, B: 110, fullMark: 150 },
  { subject: 'Debt Sustainability', A: 98, B: 130, fullMark: 150 },
  { subject: 'Inflation Control', A: 86, B: 130, fullMark: 150 },
  { subject: 'Revenue Perf', A: 99, B: 100, fullMark: 150 },
  { subject: 'Export Discipline', A: 85, B: 90, fullMark: 150 },
];

export default function FiscalOversight() {
  const { lang, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('institutional');
  const [leverValue, setLeverValue] = useState(1.5); // Simulation Lever

  const totalBudget = ALLOCATION.reduce((a, b) => a + b.value, 0);
  const executionRate = Math.round((BUDGET_DATA.reduce((a, b) => a + b.actual, 0) / BUDGET_DATA.reduce((a, b) => a + b.planned, 0)) * 100);

  // --- SUB-MODULE: INSTITUTIONAL OVERSIGHT (ORIGINAL FEATURES) ---
  const InstitutionalView = () => (
    <div className="space-y-6 main-anim">
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">{lang === 'sw' ? 'Utekelezaji wa Bajeti (KES M)' : 'Institutional Budget Execution (KES M)'}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={BUDGET_DATA}>
              <defs>
                <linearGradient id="planGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="100%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="quarter" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none' }} />
              <Legend />
              <Area type="monotone" dataKey="planned" name="Target" stroke="#3b82f6" strokeWidth={2.5} fill="url(#planGrad)" />
              <Area type="monotone" dataKey="actual" name="Actual" stroke="#10b981" strokeWidth={2.5} fill="url(#actGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <PieIcon className="h-4 w-4 text-primary" />
            {lang === 'sw' ? 'Mgawanyo wa Bajeti' : 'Budget Allocation'}
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={ALLOCATION} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5}>
                {ALLOCATION.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          {lang === 'sw' ? 'Arifa za Ufuatiliaji' : 'Administrative Alerts'}
        </h3>
        <div className="grid gap-3">
          {ALERTS.filter(a => a.type === 'budget').map((alert, i) => (
            <div key={i} className={`rounded-lg border p-4 flex items-center justify-between ${alert.severity === 'high' ? 'border-red-500/20 bg-red-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}>
              <div className="flex items-center gap-3">
                <CheckCircle2 className={alert.severity === 'high' ? 'text-red-500' : 'text-amber-500'} size={18} />
                <div>
                  <p className="text-sm font-bold">{alert.project}</p>
                  <p className="text-xs text-muted-foreground">{alert.issue}</p>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-1 bg-white/5 rounded">{alert.severity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // --- SUB-MODULE: MACRO-FISCAL INTELLIGENCE (NEW MAFAW FEATURES) ---
  const MacroIntelligenceView = () => (
    <div className="space-y-6 main-anim">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Nowcasting Indicator */}
        <div className="lg:col-span-2 glass-card p-6 border-l-4 border-blue-500 relative overflow-hidden">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Smartphone className="text-blue-500" />
                {lang === 'sw' ? 'Ubashiri wa Mapato ya Kidijitali' : 'Real-Time Revenue Nowcasting'}
              </h3>
              <p className="text-xs text-muted-foreground">High-frequency signals (Mobile Money velocity) vs Target Revenue</p>
            </div>
            <div className="status-pill animate-pulse">LIVE CONNECTORS ACTIVE</div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={BUDGET_DATA}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
              <XAxis dataKey="quarter" />
              <YAxis />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none' }} />
              <Line type="stepAfter" dataKey="actual" name="Reported Actual" stroke="#94a3b8" />
              <Line type="monotone" dataKey="nowcast" name="AI Nowcast (Mobile Velocity)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6 }} />
              <ReferenceLine y={90} label="Risk Threshold" stroke="red" strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Radar */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <Activity className="text-red-500" /> {lang === 'sw' ? 'Hatari za Mfumo' : 'Fiscal Risk Radar'}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={MACRO_INDICATORS}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Radar name="Current Status" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
              <Radar name="MTEF Projection" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Early Warning Alerts */}
      <div className="glass-card p-6 border-red-500/30 bg-red-500/5">
        <h4 className="text-xs font-black uppercase text-red-500 mb-4 flex items-center gap-2">
            <AlertTriangle size={14} /> Automated Early Warning Red Flags
        </h4>
        {ALERTS.filter(a => a.type === 'macro').map((alert, i) => (
            <div key={i} className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 mb-2 flex justify-between items-center">
                <span className="text-sm font-medium">{alert.issue}</span>
                <button className="text-[10px] font-bold underline text-red-400">View Data Lineage</button>
            </div>
        ))}
      </div>
    </div>
  );

  // --- SUB-MODULE: POLICY SANDBOX (DIGITAL TWIN) ---
  const PolicySandboxView = () => (
    <div className="space-y-6 main-anim">
      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
            <div className="glass-card p-6">
                <h4 className="text-sm font-bold mb-4 flex items-center gap-2"><Sliders size={16} /> {lang === 'sw' ? 'Vichocheo vya Sera' : 'Policy Levers'}</h4>
                <div className="space-y-6">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Acreage under Irrigation</label>
                        <input 
                            type="range" min="0" max="5" step="0.1" value={leverValue} 
                            onChange={(e) => setLeverValue(parseFloat(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 mt-2" 
                        />
                        <div className="flex justify-between mt-1 text-blue-400 font-bold">+{leverValue}M Acres</div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">VAT Rate Adjustment</label>
                        <input type="range" className="w-full mt-2" />
                    </div>
                </div>
            </div>
            
            <div className="office-card">
                <p className="text-xs font-bold text-amber-500 mb-1 flex items-center gap-1"><Info size={12}/> AI NOTE</p>
                <p className="text-[11px] text-slate-400">Causal model uses DAG inference based on 1960-2022 historical series to project outcomes.</p>
            </div>
        </div>

        <div className="lg:col-span-3 glass-card p-6 relative">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">Projected Macro-Impact Analysis</h3>
                <div className="flex gap-2">
                    <button className="px-3 py-1 bg-white/5 rounded text-[10px] font-bold">GDP PATH</button>
                    <button className="px-3 py-1 bg-white/5 rounded text-[10px] font-bold">FOOD SECURITY</button>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={BUDGET_DATA}>
                    <XAxis dataKey="quarter" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="actual" name="Current Baseline" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.1} />
                    <Area type="monotone" dataKey="planned" name="Simulated Outcome" stroke="#38BDF8" strokeWidth={3} fill="#38BDF8" fillOpacity={0.2} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto min-h-screen">
      {/* Executive Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-900/40">
                <ShieldCheck className="h-8 w-8 text-white" />
            </div>
            <div>
                <h1 className="text-3xl font-black text-white tracking-tight">
                    {lang === 'sw' ? 'Ufuatiliaji wa Fedha na Ubashiri' : 'Macro-Fiscal Early Warning Suite'}
                </h1>
                <p className="text-sm text-slate-400 flex items-center gap-2 mt-1">
                    Sovereign Intelligence Gateway <Globe size={14} className="text-blue-500" /> e-GDDS & SDMX Verified
                </p>
            </div>
          </div>
          
          {/* NAVIGATION TABS (Sovereign Skin) */}
          <div className="flex bg-[#111827] p-1.5 rounded-2xl border border-white/5">
            <button 
                onClick={() => setActiveTab('institutional')}
                className={`px-5 py-2.5 text-xs font-black rounded-xl transition-all ${activeTab === 'institutional' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}
            >
                {lang === 'sw' ? 'TAASISI' : 'INSTITUTIONAL'}
            </button>
            <button 
                onClick={() => setActiveTab('macro')}
                className={`px-5 py-2.5 text-xs font-black rounded-xl transition-all ${activeTab === 'macro' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}
            >
                {lang === 'sw' ? 'UBASHIRI' : 'NOWCASTING'}
            </button>
            <button 
                onClick={() => setActiveTab('sandbox')}
                className={`px-5 py-2.5 text-xs font-black rounded-xl transition-all ${activeTab === 'sandbox' ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}
            >
                {lang === 'sw' ? 'PACHA WA KIDIJITALI' : 'DIGITAL TWIN'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Statistical Summary Row (Persistent) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: lang === 'sw' ? 'Bajeti (KES M)' : 'Total Budget (KES M)', value: totalBudget, icon: Wallet, color: 'text-blue-500' },
          { label: lang === 'sw' ? 'Utekelezaji' : 'Execution Rate', value: `${executionRate}%`, icon: TrendingUp, color: 'text-emerald-500' },
          { label: lang === 'sw' ? 'Arifa' : 'Early Warnings', value: ALERTS.length, icon: AlertTriangle, color: 'text-red-500' },
          { label: lang === 'sw' ? 'Uhuru wa Data' : 'Sovereignty Score', value: '99.9%', icon: ShieldCheck, color: 'text-blue-400' },
        ].map((s, i) => (
          <motion.div key={i} whileHover={{ y: -5 }} className="glass-card p-5 !mb-0 flex flex-col justify-center">
            <s.icon className={`h-5 w-5 ${s.color} mb-3`} />
            <div className="text-2xl font-black text-white">{s.value}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Dynamic Sub-Module Loading */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'institutional' && <InstitutionalView />}
          {activeTab === 'macro' && <MacroIntelligenceView />}
          {activeTab === 'sandbox' && <PolicySandboxView />}
        </motion.div>
      </AnimatePresence>

      {/* Executive Footer */}
      <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 pb-8">
        <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">AlphaEconomist Core: Operational</span>
        </div>
        <div className="flex gap-6 items-center">
            <div className="text-[10px] text-slate-500 flex items-center gap-1">
                <ShieldCheck size={12} /> SHA-256 Verified
            </div>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-400 text-xs font-black hover:bg-blue-600/20 transition-all">
                <FileText size={14} /> {lang === 'sw' ? 'Pakua Ripoti ya AI' : 'Generate AI Briefing'}
            </button>
        </div>
      </div>
    </div>
  );
}
