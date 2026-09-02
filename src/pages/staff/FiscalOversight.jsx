import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, TrendingUp, TrendingDown, AlertTriangle,
  Wallet, PieChart as PieIcon, Target, CheckCircle2,
  Zap, Smartphone, BarChart3, Sliders, FileText, 
  ShieldCheck, Activity, Globe, Info, Search, Bot
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, ReferenceLine, RadarChart, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

// --- MOCK DATA: INSTITUTIONAL ---
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

// --- MOCK DATA: MAFAW AI INTELLIGENCE ---
const NOWCAST_REVENUE = [
  { month: 'Jan', target: 160, actual: 158, mobile_velocity: 92 },
  { month: 'Feb', target: 165, actual: 155, mobile_velocity: 88 },
  { month: 'Mar', target: 170, actual: 148, mobile_velocity: 75 }, // Anomaly detected
  { month: 'Apr', target: 175, actual: 142, mobile_velocity: 70 },
];

const FISCAL_RISK_RADAR = [
  { subject: 'Debt Sustainability', A: 120, B: 110, fullMark: 150 },
  { subject: 'Inflation Control', A: 98, B: 130, fullMark: 150 },
  { subject: 'Revenue Performance', A: 86, B: 130, fullMark: 150 },
  { subject: 'Expenditure Pressure', A: 99, B: 100, fullMark: 150 },
  { subject: 'Exchange Volatility', A: 85, B: 90, fullMark: 150 },
];

const ALERTS = [
  { project: 'Macroeconomic Modeling Lab', issue: 'Spending at 85% but milestone at 60%', severity: 'high', type: 'budget' },
  { project: 'Revenue Performance', issue: 'KRA collection 5.2% below BPS glide path', severity: 'high', type: 'macro' },
  { project: 'County Training Program', issue: 'Underspent by 32% — risk of reallocation', severity: 'medium', type: 'budget' },
  { project: 'Digital Transactions', issue: 'Mobile money velocity drop detected in Ward 027', severity: 'medium', type: 'macro' },
];

export default function FiscalOversight() {
  const { lang, t } = useLanguage();
  const [activeTab, setActiveTab] = useState('institutional');
  const [leverValue, setLeverValue] = useState(1.5); // Simulation Lever

  const totalBudget = ALLOCATION.reduce((a, b) => a + b.value, 0);
  const executionRate = Math.round((BUDGET_DATA.reduce((a, b) => a + b.actual, 0) / BUDGET_DATA.reduce((a, b) => a + b.planned, 0)) * 100);

  // --- SUB-MODULE 1: INSTITUTIONAL OVERSIGHT ---
  const InstitutionalView = () => (
    <div className="space-y-6 main-anim">
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-4">{lang === 'sw' ? 'Utekelezaji wa Bajeti (KES M)' : 'Budget Execution Tracking (KES M)'}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={BUDGET_DATA}>
              <defs>
                <linearGradient id="planGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} /><stop offset="100%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.2} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
              <XAxis dataKey="quarter" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#111827', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }} />
              <Area type="monotone" dataKey="planned" name="Planned" stroke="#3b82f6" strokeWidth={3} fill="url(#planGrad)" />
              <Area type="monotone" dataKey="actual" name="Actual" stroke="#10b981" strokeWidth={3} fill="url(#actGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <PieIcon className="h-4 w-4 text-primary" />
            {lang === 'sw' ? 'Mgawanyo wa Bajeti' : 'Strategic Resource Allocation'}
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={ALLOCATION} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={8}>
                {ALLOCATION.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Institutional Alerts */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          {lang === 'sw' ? 'Arifa za Bajeti' : 'Institutional Budget Alerts'}
        </h3>
        <div className="space-y-3">
          {ALERTS.filter(a => a.type === 'budget').map((alert, i) => (
            <div key={i} className={`rounded-lg border p-4 flex items-center justify-between ${alert.severity === 'high' ? 'border-red-500/20 bg-red-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${alert.severity === 'high' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'}`}>
                    {alert.severity === 'high' ? <TrendingDown size={16}/> : <Activity size={16}/>}
                </div>
                <div>
                  <p className="text-sm font-bold">{alert.project}</p>
                  <p className="text-xs text-muted-foreground">{alert.issue}</p>
                </div>
              </div>
              <CheckCircle2 className="text-slate-700" size={16} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // --- SUB-MODULE 2: MAFAW PREDICTIVE AGENT (NEW) ---
  const PredictiveView = () => (
    <div className="space-y-6 main-anim">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Real-time Nowcasting */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
             <div className="status-pill animate-pulse">LIVE SIGNALS INGESTING</div>
          </div>
          <h3 className="text-sm font-bold mb-1 flex items-center gap-2">
            <Smartphone className="text-blue-500" size={18} />
            {lang === 'sw' ? 'Utabiri wa Mapato ya Sasa (Nowcasting)' : 'High-Frequency Revenue Nowcasting'}
          </h3>
          <p className="text-xs text-muted-foreground mb-6">Blended analysis of M-Pesa velocity and tax-base activity.</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={NOWCAST_REVENUE}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '12px' }} />
              <Line type="monotone" dataKey="target" name="BPS Target" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="actual" name="Reported" stroke="#94a3b8" strokeWidth={2} />
              <Line type="monotone" dataKey="mobile_velocity" name="AI Nowcast (Mobile Money)" stroke="#10b981" strokeWidth={4} dot={{ r: 6 }} />
              <ReferenceLine y={145} label="Alert Threshold" stroke="#ef4444" strokeDasharray="3 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Fiscal Risk Radar */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="text-sm font-bold mb-6 flex items-center gap-2">
            <Activity className="text-red-500" size={18} />
            {lang === 'sw' ? 'Rada ya Hatari za Fedha' : 'Fiscal Risk Radar'}
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={FISCAL_RISK_RADAR}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <Radar name="Current" dataKey="A" stroke="#ef4444" fill="#ef4444" fillOpacity={0.5} />
              <Radar name="Safety Baseline" dataKey="B" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
          <div className="mt-4 p-3 bg-red-500/10 rounded-xl border border-red-500/20 text-[11px] text-red-400 italic">
            Warning: Revenue Performance is currently 14 points below the MTEF safety zone.
          </div>
        </div>
      </div>

      {/* MAFAW Red Flags */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h4 className="text-xs font-black uppercase text-red-500 mb-4 tracking-[0.2em]">Automated Early Warning Signals</h4>
        <div className="space-y-3">
          {ALERTS.filter(a => a.type === 'macro').map((alert, i) => (
            <div key={i} className="p-4 rounded-xl border border-white/5 bg-white/5 flex justify-between items-center group hover:border-red-500/50 transition-all">
                <div className="flex items-center gap-3">
                    <Zap className="text-red-500 animate-pulse" size={16} />
                    <span className="text-sm font-bold">{alert.issue}</span>
                </div>
                <button className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    INVESTIGATE SPI LINEAGE
                </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // --- SUB-MODULE 3: POLICY SANDBOX (DIGITAL TWIN) ---
  const SandboxView = () => (
    <div className="space-y-6 main-anim">
      <div className="grid lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
            <div className="rounded-2xl border border-border bg-card p-6">
                <h4 className="text-xs font-black uppercase mb-6 flex items-center gap-2"><Sliders size={14}/> Policy Levers</h4>
                <div className="space-y-8">
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Acreage under Irrigation</label>
                        <input 
                            type="range" min="0" max="5" step="0.1" value={leverValue} 
                            onChange={(e) => setLeverValue(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 mt-2" 
                        />
                        <div className="flex justify-between mt-2 text-blue-400 font-black text-sm">+{leverValue}M Acres</div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Fiscal Consolidation Intensity</label>
                        <input type="range" className="w-full mt-2 h-1.5 accent-emerald-500" />
                    </div>
                </div>
            </div>
            
            <div className="office-card !border-amber-500/50 bg-amber-500/5">
                <p className="text-xs font-bold text-amber-500 mb-1 flex items-center gap-1"><Bot size={14}/> AI CO-PILOT NOTE</p>
                <p className="text-[10px] leading-relaxed text-slate-400">Simulation uses Bayesian DAGs to isolate the "Maize Yield" variable from rainfall variance based on 1963-2022 actuals.</p>
            </div>
        </div>

        <div className="lg:col-span-3 rounded-2xl border border-border bg-card p-6">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-bold">Projected Outcome: GDP Growth & Food Security</h3>
                <div className="flex bg-white/5 p-1 rounded-lg">
                    <button className="px-3 py-1 text-[10px] font-bold bg-blue-600 rounded-md">GDP TRAJECTORY</button>
                    <button className="px-3 py-1 text-[10px] font-bold">REVENUE RATIO</button>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={380}>
                <AreaChart data={BUDGET_DATA}>
                    <XAxis dataKey="quarter" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="actual" name="Current Baseline" stroke="#94a3b8" strokeWidth={2} fill="#94a3b8" fillOpacity={0.05} />
                    <Area type="monotone" dataKey="planned" name="Simulated Scenario" stroke="#38BDF8" strokeWidth={4} fill="#38BDF8" fillOpacity={0.15} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto min-h-screen">
      {/* Executive Header Banner */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center shadow-xl shadow-blue-900/20">
                <ShieldCheck className="text-white" size={28} />
            </div>
            <div>
                <h1 className="text-3xl font-black text-white tracking-tighter uppercase">
                    {lang === 'sw' ? 'Ufuatiliaji wa Fedha' : 'Macro-Fiscal Suite'}
                </h1>
                <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase tracking-widest">v14.2 Sovereign AI</span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Globe size={10}/> National Planning Network</span>
                </div>
            </div>
          </div>
          
          {/* Module Toggles */}
          <div className="flex bg-[#111827] p-1.5 rounded-2xl border border-white/5 shadow-2xl">
            <button 
                onClick={() => setActiveTab('institutional')}
                className={`px-5 py-2 text-[10px] font-black rounded-xl transition-all ${activeTab === 'institutional' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}
            >
                INSTITUTIONAL
            </button>
            <button 
                onClick={() => setActiveTab('predictive')}
                className={`px-5 py-2 text-[10px] font-black rounded-xl transition-all ${activeTab === 'predictive' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}
            >
                AI NOWCASTING
            </button>
            <button 
                onClick={() => setActiveTab('sandbox')}
                className={`px-5 py-2 text-[10px] font-black rounded-xl transition-all ${activeTab === 'sandbox' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}
            >
                POLICY SANDBOX
            </button>
          </div>
        </div>
      </motion.div>

      {/* Persistent KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {[
          { label: lang === 'sw' ? 'Bajeti (KES M)' : 'Total Budget (KES M)', value: totalBudget, icon: Wallet, color: 'text-blue-500' },
          { label: lang === 'sw' ? 'Utekelezaji' : 'Execution Rate', value: `${executionRate}%`, icon: TrendingUp, color: 'text-emerald-500' },
          { label: lang === 'sw' ? 'Arifa za Hatari' : 'Fiscal Warning Flags', value: ALERTS.filter(a => a.severity === 'high').length, icon: AlertTriangle, color: 'text-red-500' },
          { label: lang === 'sw' ? 'Njia Sahihi' : 'On Track Projects', value: ALERTS.filter(a => a.severity === 'low').length + 1, icon: CheckCircle2, color: 'text-emerald-500' },
        ].map((s, i) => (
          <motion.div key={i} whileHover={{ y: -5 }} transition={{ type: 'spring', stiffness: 300 }} className="rounded-2xl border border-border bg-card p-5 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 rounded-full blur-2xl opacity-10 ${s.color.replace('text', 'bg')}`} />
            <s.icon className={`h-5 w-5 ${s.color} mb-3`} />
            <div className="text-2xl font-black text-white">{s.value}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Dynamic Module Rendering */}
      <div className="min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'institutional' && <InstitutionalView />}
              {activeTab === 'predictive' && <PredictiveView />}
              {activeTab === 'sandbox' && <SandboxView />}
            </motion.div>
          </AnimatePresence>
      </div>

      {/* High-End Reporting Footer */}
      <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 pb-12">
        <div className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">AI Engine Status: Operational</span>
        </div>
        <div className="flex gap-4">
            <button className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                <Search size={14} /> Audit Trace
            </button>
            <button className="flex items-center gap-3 px-8 py-3 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 shadow-2xl shadow-blue-900/40 transition-all">
                <FileText size={16} /> Generate RAG Policy Brief
            </button>
        </div>
      </div>
    </div>
  );
}
