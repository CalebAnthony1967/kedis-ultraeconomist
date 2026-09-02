import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { motion } from 'framer-motion';
import {
  DollarSign, TrendingUp, TrendingDown, AlertTriangle,
  Wallet, PieChart as PieIcon, Target, CheckCircle2,
  Activity, Zap, Calendar, ArrowRight, RefreshCw,
  Play, Save, Download, FileText, Bell, Shield,
  ChevronDown, ChevronUp, Eye, EyeOff, Sliders,
  BarChart3, LineChart, AreaChart as AreaChartIcon,
  Gauge, Clock, Signal, Radio, Database, Cloud,
  ExternalLink, Sparkles, Brain, GitBranch
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, BarChart, Bar
} from 'recharts';

// ============================================================================
// 1. MOCK DATA
// ============================================================================

// Nowcasting data
const NOWCAST_DATA = {
  gdp: { estimate: 12.4, previous: 12.3, change: 0.8, confidence: [12.2, 12.6], status: 'increasing' },
  revenue: { estimate: 2.1, target: 2.3, gap: -0.2, gapPercent: -8.7, status: 'below_target' },
  inflation: { value: 6.2, previous: 5.9, change: 0.3, target: 5.0, status: 'elevated' },
  mobile_money: { volume: 345, previous: 300, change: 15, unit: 'Billion KES' },
  fuel_consumption: { value: 4.8, previous: 4.5, change: 6.7, unit: 'Million Litres' },
  electricity: { value: 2.1, previous: 2.0, change: 5.0, unit: 'GWh' },
};

// GDP Components
const GDP_COMPONENTS = [
  { sector: 'Agriculture', value: 22, color: '#10b981' },
  { sector: 'Manufacturing', value: 18, color: '#3b82f6' },
  { sector: 'Services', value: 35, color: '#f59e0b' },
  { sector: 'Construction', value: 12, color: '#8b5cf6' },
  { sector: 'Trade', value: 13, color: '#06b6d4' },
];

// Budget Execution
const BUDGET_EXECUTION = [
  { quarter: 'Q1 2024', planned: 85, actual: 78 },
  { quarter: 'Q2 2024', planned: 92, actual: 88 },
  { quarter: 'Q3 2024', planned: 88, actual: 71 },
  { quarter: 'Q4 2024', planned: 95, actual: 82 },
  { quarter: 'Q1 2025', planned: 90, actual: 84 },
];

// Risk Indicators (Early Warning)
const RISK_INDICATORS = [
  { 
    id: 'debt_gdp', 
    name: 'Debt-to-GDP Ratio', 
    value: 68.2, 
    threshold: 65, 
    forecast: 72.5, 
    status: 'critical',
    trend: 'increasing',
    probability: 92,
    description: 'Projected to exceed 70% by Q3 2025'
  },
  { 
    id: 'inflation', 
    name: 'Inflation Rate', 
    value: 6.2, 
    threshold: 7.5, 
    forecast: 7.8, 
    status: 'warning',
    trend: 'increasing',
    probability: 68,
    description: 'Potential breach of CBK target band'
  },
  { 
    id: 'exchange_rate', 
    name: 'Exchange Rate (KES/USD)', 
    value: 152.4, 
    threshold: 160, 
    forecast: 158.2, 
    status: 'stable',
    trend: 'moderate',
    probability: 45,
    description: 'Pressure from current account deficit'
  },
  { 
    id: 'revenue_gap', 
    name: 'Revenue Collection Gap', 
    value: -8.7, 
    threshold: -5, 
    forecast: -12.3, 
    status: 'critical',
    trend: 'worsening',
    probability: 88,
    description: 'BPS target shortfall widening'
  },
  { 
    id: 'expenditure', 
    name: 'Expenditure Overrun', 
    value: 6.4, 
    threshold: 3, 
    forecast: 8.1, 
    status: 'warning',
    trend: 'increasing',
    probability: 72,
    description: 'Recurrent expenditure pressure'
  },
];

// Simulation Levers
const SIMULATION_LEVERS = [
  { key: 'exchange_rate', label: 'KES/USD Depreciation (%)', min: -20, max: 20, default: 0, unit: '%' },
  { key: 'interest_rate', label: 'Lending Rate (%)', min: 5, max: 20, default: 10, unit: '%' },
  { key: 'fertilizer_subsidy', label: 'Fertiliser Subsidy Level (%)', min: 0, max: 100, default: 100, unit: '%' },
  { key: 'oil_prices', label: 'Global Oil Prices (USD/barrel)', min: 50, max: 150, default: 85, unit: '$' },
];

// Alerts Feed
const ALERT_FEED = [
  { id: 1, level: 'critical', title: 'Revenue Collection Below Target', description: 'Revenue shortfall of KES 115.3B against BPS 2025 target', time: '2 hours ago', category: 'Revenue' },
  { id: 2, level: 'critical', title: 'Debt-to-GDP Ratio Rising', description: 'Projected to exceed 70% threshold by Q3 2025', time: '4 hours ago', category: 'Debt' },
  { id: 3, level: 'warning', title: 'Inflation Pressure', description: 'Food inflation at 8.4% exceeds 7.5% threshold', time: '6 hours ago', category: 'Inflation' },
  { id: 4, level: 'warning', title: 'Expenditure Overrun', description: 'Recurrent expenditure exceeds budget by 6.4%', time: '1 day ago', category: 'Expenditure' },
  { id: 5, level: 'info', title: 'Mobile Money Volume Up', description: 'M-Pesa transaction volume up 15% month-on-month', time: '1 day ago', category: 'Nowcasting' },
];

// Policy Brief Template
const POLICY_BRIEFS = [
  { id: 1, title: 'Revenue Shortfall Risk Assessment', date: '2025-02-15', status: 'draft' },
  { id: 2, title: 'Debt Sustainability Analysis', date: '2025-02-10', status: 'approved' },
  { id: 3, title: 'Inflation Outlook Q2 2025', date: '2025-02-05', status: 'pending_review' },
];

// ============================================================================
// 2. HELPER FUNCTIONS
// ============================================================================

const StatusBadge = ({ status }) => {
  const configs = {
    critical: { bg: 'bg-red-100', text: 'text-red-700', label: 'Critical' },
    warning: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Warning' },
    stable: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Stable' },
    increasing: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: '↑ Increasing' },
    decreasing: { bg: 'bg-red-100', text: 'text-red-700', label: '↓ Decreasing' },
    elevated: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Elevated' },
    below_target: { bg: 'bg-red-100', text: 'text-red-700', label: 'Below Target' },
    info: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Info' },
    draft: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Draft' },
    approved: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Approved' },
    pending_review: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending Review' },
  };
  const config = configs[status] || configs.info;
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

const TrendIcon = ({ value }) => {
  if (value > 0) return <TrendingUp className="h-4 w-4 text-emerald-500" />;
  if (value < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <div className="h-4 w-4" />;
};

// ============================================================================
// 3. MAIN COMPONENT
// ============================================================================

export default function FiscalOversight() {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState('nowcasting');
  const [simulationLevers, setSimulationLevers] = useState(
    Object.fromEntries(SIMULATION_LEVERS.map(l => [l.key, l.default]))
  );
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedBrief, setSelectedBrief] = useState('');
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);
  const [briefContent, setBriefContent] = useState('');
  const [simulationResult, setSimulationResult] = useState(null);

  // Run simulation
  const runSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const baseline = { deficit: 4.2, gdp: 5.4, inflation: 6.2, debt: 68.2 };
      const impact = {
        exchange_rate: simulationLevers.exchange_rate * 0.08,
        interest_rate: simulationLevers.interest_rate * 0.05,
        fertilizer_subsidy: (100 - simulationLevers.fertilizer_subsidy) * 0.03,
        oil_prices: (simulationLevers.oil_prices - 85) * 0.02,
      };
      const totalImpact = Object.values(impact).reduce((a, b) => a + b, 0);
      
      setSimulationResult({
        deficit: baseline.deficit + totalImpact * 0.3,
        gdp: baseline.gdp - totalImpact * 0.15,
        inflation: baseline.inflation + totalImpact * 0.1,
        debt: baseline.debt + totalImpact * 0.2,
        impact: totalImpact,
        baseline,
      });
      setIsSimulating(false);
    }, 1500);
  };

  // Generate policy brief
  const generateBrief = () => {
    setIsGeneratingBrief(true);
    setTimeout(() => {
      setBriefContent(`
# Executive Summary
Based on current fiscal indicators and economic projections, Kenya faces moderate fiscal risks in the near term. Revenue collection is trending below BPS targets by approximately 8.7%, while debt-to-GDP ratio continues to rise.

# Key Findings
1. **Revenue Shortfall**: KES 115.3B gap against BPS 2025 targets
2. **Debt Sustainability**: Debt-to-GDP projected to reach 72.5% by 2026
3. **Inflation Pressure**: Food inflation at 8.4% exceeding threshold

# Recommendations
1. Enhance revenue collection through digital tax compliance
2. Reassess expenditure priorities to reduce recurrent spending
3. Consider supplementary budget adjustments for Q3 2025

# Sources
- Kenya National Bureau of Statistics (KNBS) Economic Survey 2024
- National Treasury Budget Policy Statement 2025
- Central Bank of Kenya (CBK) Monetary Policy Statement
      `);
      setIsGeneratingBrief(false);
    }, 2000);
  };

  const tabs = [
    { id: 'nowcasting', label: lang === 'sw' ? 'Uchambuzi wa Wakati Halisi' : 'Nowcasting', icon: Zap },
    { id: 'early_warning', label: lang === 'sw' ? 'Mfumo wa Maonyo' : 'Early Warning', icon: Bell },
    { id: 'scenario', label: lang === 'sw' ? 'Simulizi' : 'Scenario Simulation', icon: Sliders },
    { id: 'briefs', label: lang === 'sw' ? 'Ripoti' : 'Policy Briefs', icon: FileText },
  ];

  // ============================================================================
  // 4. RENDER
  // ============================================================================

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Brain className="h-6 w-6 text-primary" />
              <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-foreground">
                {lang === 'sw' ? 'Mfumo wa Uchambuzi wa Makro-Fiskali' : 'Macro-Fiscal Early Warning (MAFAW)'}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20">
                {lang === 'sw' ? 'Kijaribio' : 'Pilot'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Radio className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
              {lang === 'sw'
                ? 'Uchambuzi wa makro-fiskali kwa kutumia data ya wakati halisi na mifano ya utabiri'
                : 'AI-powered macroeconomic forecasting & fiscal risk early warning system'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-medium hover:bg-secondary transition-colors">
              <RefreshCw className="h-3.5 w-3.5" />
              {lang === 'sw' ? 'Sasisha Data' : 'Refresh Data'}
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
              <Shield className="h-3.5 w-3.5" />
              {lang === 'sw' ? 'Vault Auth' : 'Vault Auth'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        {[
          { label: lang === 'sw' ? 'GDP (Trilioni KES)' : 'GDP (KES Trillion)', value: NOWCAST_DATA.gdp.estimate, change: NOWCAST_DATA.gdp.change, icon: DollarSign, color: 'text-primary' },
          { label: lang === 'sw' ? 'Mapato (Trilioni KES)' : 'Revenue (KES Trillion)', value: NOWCAST_DATA.revenue.estimate, change: NOWCAST_DATA.revenue.gap, icon: Wallet, color: 'text-red-600' },
          { label: lang === 'sw' ? 'Mfumuko wa Bei (%)' : 'Inflation (%)', value: NOWCAST_DATA.inflation.value, change: NOWCAST_DATA.inflation.change, icon: TrendingUp, color: 'text-amber-600' },
          { label: lang === 'sw' ? 'Arifa Muhimu' : 'Critical Alerts', value: ALERT_FEED.filter(a => a.level === 'critical').length, icon: AlertTriangle, color: 'text-red-600' },
        ].map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="rounded-2xl border border-border bg-card p-5 hover:shadow-lg transition-shadow"
          >
            <kpi.icon className={`h-5 w-5 ${kpi.color} mb-2`} />
            <div className="flex items-end justify-between">
              <div>
                <div className="font-display text-2xl font-extrabold text-foreground">{kpi.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{kpi.label}</div>
              </div>
              {kpi.change !== undefined && (
                <div className={`flex items-center gap-1 text-sm font-semibold ${kpi.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  <TrendIcon value={kpi.change} />
                  {kpi.change > 0 ? '+' : ''}{kpi.change}%
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-6 border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex items-center gap-2
                ${isActive 
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                  : 'text-muted-foreground hover:bg-secondary'
                }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ============================================================
          TAB 1: NOWCASTING
          ============================================================ */}
      {activeTab === 'nowcasting' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Nowcasting Grid */}
          <div className="grid lg:grid-cols-3 gap-4">
            {/* GDP Card */}
            <div className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    {lang === 'sw' ? 'Uchambuzi wa GDP' : 'GDP Nowcast'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {lang === 'sw' ? 'Makadirio ya robo mwaka' : 'Quarterly estimate with high-frequency signals'}
                  </p>
                </div>
                <StatusBadge status={NOWCAST_DATA.gdp.status} />
              </div>
              <div className="flex items-end gap-4 mb-4">
                <div>
                  <div className="text-3xl font-display font-extrabold text-foreground">
                    KES {NOWCAST_DATA.gdp.estimate}T
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ± {((NOWCAST_DATA.gdp.confidence[1] - NOWCAST_DATA.gdp.confidence[0]) / 2).toFixed(1)}% CI
                  </div>
                </div>
                <div className="flex items-center gap-1 text-emerald-600">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-lg font-bold">+{NOWCAST_DATA.gdp.change}%</span>
                  <span className="text-xs text-muted-foreground">vs previous</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="rounded-lg bg-secondary/30 p-3">
                  <div className="text-muted-foreground">Mobile Money</div>
                  <div className="font-bold text-foreground">KES {NOWCAST_DATA.mobile_money.volume}B</div>
                  <div className="text-emerald-600">+{NOWCAST_DATA.mobile_money.change}%</div>
                </div>
                <div className="rounded-lg bg-secondary/30 p-3">
                  <div className="text-muted-foreground">Fuel Consumption</div>
                  <div className="font-bold text-foreground">{NOWCAST_DATA.fuel_consumption.value}M L</div>
                  <div className="text-emerald-600">+{NOWCAST_DATA.fuel_consumption.change}%</div>
                </div>
                <div className="rounded-lg bg-secondary/30 p-3">
                  <div className="text-muted-foreground">Electricity</div>
                  <div className="font-bold text-foreground">{NOWCAST_DATA.electricity.value} GWh</div>
                  <div className="text-emerald-600">+{NOWCAST_DATA.electricity.change}%</div>
                </div>
              </div>
            </div>

            {/* Revenue Card */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-primary" />
                  {lang === 'sw' ? 'Mapato' : 'Revenue'}
                </h3>
                <StatusBadge status={NOWCAST_DATA.revenue.status} />
              </div>
              <div className="text-2xl font-display font-extrabold text-foreground">
                KES {NOWCAST_DATA.revenue.estimate}T
              </div>
              <div className="text-sm text-red-600 font-medium">
                {NOWCAST_DATA.revenue.gapPercent}% below BPS target
              </div>
              <div className="mt-4 h-2 rounded-full bg-secondary overflow-hidden">
                <div 
                  className="h-full rounded-full bg-red-500"
                  style={{ width: `${Math.max(0, (NOWCAST_DATA.revenue.estimate / NOWCAST_DATA.revenue.target) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Actual: {((NOWCAST_DATA.revenue.estimate / NOWCAST_DATA.revenue.target) * 100).toFixed(0)}%</span>
                <span>Target: KES {NOWCAST_DATA.revenue.target}T</span>
              </div>
              <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                <AlertTriangle className="h-3.5 w-3.5 inline mr-1" />
                {lang === 'sw' 
                  ? 'Mapato yako chini ya lengo la BPS kwa KES 115.3B'
                  : 'Revenue shortfall against BPS target'}
              </div>
            </div>
          </div>

          {/* GDP Components & Budget Execution */}
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <PieIcon className="h-4 w-4 text-primary" />
                {lang === 'sw' ? 'Vipengele vya GDP' : 'GDP Components'}
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={GDP_COMPONENTS} dataKey="value" nameKey="sector" cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={2}>
                    {GDP_COMPONENTS.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(150 15% 90%)', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                {lang === 'sw' ? 'Utekelezaji wa Bajeti' : 'Budget Execution'}
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={BUDGET_EXECUTION} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(150 15% 90%)" />
                  <XAxis dataKey="quarter" tick={{ fontSize: 10, fill: 'hsl(155 10% 40%)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(155 10% 40%)' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(150 15% 90%)', fontSize: '11px' }} />
                  <Bar dataKey="planned" fill="#3b82f6" name="Planned" />
                  <Bar dataKey="actual" fill="#10b981" name="Actual" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}

      {/* ============================================================
          TAB 2: EARLY WARNING SYSTEM
          ============================================================ */}
      {activeTab === 'early_warning' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Alert Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-border bg-card p-4 text-center">
              <div className="text-2xl font-display font-extrabold text-red-600">{ALERT_FEED.filter(a => a.level === 'critical').length}</div>
              <div className="text-xs text-muted-foreground">{lang === 'sw' ? 'Muhimu' : 'Critical'}</div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 text-center">
              <div className="text-2xl font-display font-extrabold text-amber-600">{ALERT_FEED.filter(a => a.level === 'warning').length}</div>
              <div className="text-xs text-muted-foreground">{lang === 'sw' ? 'Tahadhari' : 'Warning'}</div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 text-center">
              <div className="text-2xl font-display font-extrabold text-emerald-600">{ALERT_FEED.filter(a => a.level === 'info').length}</div>
              <div className="text-xs text-muted-foreground">{lang === 'sw' ? 'Taarifa' : 'Info'}</div>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 text-center">
              <div className="text-2xl font-display font-extrabold text-primary">{RISK_INDICATORS.length}</div>
              <div className="text-xs text-muted-foreground">{lang === 'sw' ? 'Viashiria' : 'Indicators Tracked'}</div>
            </div>
          </div>

          {/* Risk Indicators */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Gauge className="h-4 w-4 text-primary" />
              {lang === 'sw' ? 'Viashiria vya Hatari' : 'Risk Indicators'}
              <span className="text-xs text-muted-foreground font-normal ml-2">
                {lang === 'sw' ? 'Utabiri wa miezi 6-12' : '6-12 month forecast'}
              </span>
            </h3>
            <div className="space-y-4">
              {RISK_INDICATORS.map((indicator) => {
                const statusColors = {
                  critical: 'border-red-200 bg-red-50',
                  warning: 'border-amber-200 bg-amber-50',
                  stable: 'border-emerald-200 bg-emerald-50',
                };
                const progressColor = {
                  critical: 'bg-red-500',
                  warning: 'bg-amber-500',
                  stable: 'bg-emerald-500',
                };
                const progress = Math.min((indicator.value / (indicator.threshold * 1.5)) * 100, 100);
                
                return (
                  <div key={indicator.id} className={`rounded-lg border p-4 ${statusColors[indicator.status]}`}>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/50">
                          {indicator.status === 'critical' ? <AlertTriangle className="h-4 w-4 text-red-600" /> : <Activity className="h-4 w-4 text-amber-600" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">{indicator.name}</p>
                            <StatusBadge status={indicator.status} />
                          </div>
                          <p className="text-xs text-muted-foreground">{indicator.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-foreground">{indicator.value}{indicator.id === 'revenue_gap' ? '%' : ''}</div>
                        <div className="text-xs text-muted-foreground">
                          {lang === 'sw' ? 'Kiwango cha hatari' : 'Risk level'}: {indicator.probability}%
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{lang === 'sw' ? 'Sasa' : 'Current'}: {indicator.value}</span>
                        <span>{lang === 'sw' ? 'Utabiri' : 'Forecast'}: {indicator.forecast}</span>
                        <span>{lang === 'sw' ? 'Kizingiti' : 'Threshold'}: {indicator.threshold}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary mt-1 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${progressColor[indicator.status]}`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      )}

      {/* ============================================================
          TAB 3: SCENARIO SIMULATION
          ============================================================ */}
      {activeTab === 'scenario' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Levers Panel */}
            <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Sliders className="h-4 w-4 text-primary" />
                {lang === 'sw' ? 'Viashiria vya Sera' : 'Policy Levers'}
              </h3>
              <div className="space-y-4">
                {SIMULATION_LEVERS.map((lever) => (
                  <div key={lever.key}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <label className="font-medium text-foreground">{lever.label}</label>
                      <span className="text-primary font-bold">{simulationLevers[lever.key]}{lever.unit}</span>
                    </div>
                    <input
                      type="range"
                      min={lever.min}
                      max={lever.max}
                      value={simulationLevers[lever.key]}
                      onChange={(e) => setSimulationLevers(prev => ({
                        ...prev,
                        [lever.key]: parseFloat(e.target.value)
                      }))}
                      className="w-full h-2 rounded-full appearance-none bg-secondary cursor-pointer accent-primary"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{lever.min}{lever.unit}</span>
                      <span>{lever.max}{lever.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={runSimulation}
                disabled={isSimulating}
                className="mt-6 w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSimulating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    {lang === 'sw' ? 'Inahesabu...' : 'Simulating...'}
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    {lang === 'sw' ? 'Endesha Simulizi' : 'Run Simulation'}
                  </>
                )}
              </button>
            </div>

            {/* Results Panel */}
            <div className="lg:col-span-3 rounded-2xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <LineChart className="h-4 w-4 text-primary" />
                {lang === 'sw' ? 'Matokeo ya Simulizi' : 'Simulation Results'}
              </h3>
              {simulationResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-secondary/30 p-3 text-center">
                      <div className="text-xs text-muted-foreground">{lang === 'sw' ? 'Nakisi' : 'Deficit'}</div>
                      <div className="text-lg font-bold text-foreground">{simulationResult.deficit.toFixed(1)}%</div>
                      <div className="text-[10px] text-muted-foreground">
                        {lang === 'sw' ? 'Marekebisho' : 'Delta'}: {(simulationResult.deficit - simulationResult.baseline.deficit).toFixed(1)}%
                      </div>
                    </div>
                    <div className="rounded-lg bg-secondary/30 p-3 text-center">
                      <div className="text-xs text-muted-foreground">{lang === 'sw' ? 'Ukuaji wa GDP' : 'GDP Growth'}</div>
                      <div className="text-lg font-bold text-foreground">{simulationResult.gdp.toFixed(1)}%</div>
                      <div className="text-[10px] text-muted-foreground">
                        {lang === 'sw' ? 'Marekebisho' : 'Delta'}: {(simulationResult.gdp - simulationResult.baseline.gdp).toFixed(1)}%
                      </div>
                    </div>
                    <div className="rounded-lg bg-secondary/30 p-3 text-center">
                      <div className="text-xs text-muted-foreground">{lang === 'sw' ? 'Mfumuko wa Bei' : 'Inflation'}</div>
                      <div className="text-lg font-bold text-foreground">{simulationResult.inflation.toFixed(1)}%</div>
                      <div className="text-[10px] text-muted-foreground">
                        {lang === 'sw' ? 'Marekebisho' : 'Delta'}: {(simulationResult.inflation - simulationResult.baseline.inflation).toFixed(1)}%
                      </div>
                    </div>
                    <div className="rounded-lg bg-secondary/30 p-3 text-center">
                      <div className="text-xs text-muted-foreground">{lang === 'sw' ? 'Deni kwa GDP' : 'Debt-to-GDP'}</div>
                      <div className="text-lg font-bold text-foreground">{simulationResult.debt.toFixed(1)}%</div>
                      <div className="text-[10px] text-muted-foreground">
                        {lang === 'sw' ? 'Marekebisho' : 'Delta'}: {(simulationResult.debt - simulationResult.baseline.debt).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
                    <p className="text-xs text-muted-foreground">
                      {lang === 'sw'
                        ? `Jumla ya athari: ${simulationResult.impact.toFixed(2)}% kutoka kwa viashiria vilivyochaguliwa`
                        : `Total impact: ${simulationResult.impact.toFixed(2)}% from selected levers`
                      }
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <Sliders className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm">{lang === 'sw' ? 'Chagua viashiria na ubonyeze "Endesha Simulizi"' : 'Adjust levers and click "Run Simulation"'}</p>
                  <p className="text-xs opacity-70">{lang === 'sw' ? 'Matokeo yataonyeshwa hapa' : 'Results will appear here'}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* ============================================================
          TAB 4: POLICY BRIEFS
          ============================================================ */}
      {activeTab === 'briefs' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Briefs */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                {lang === 'sw' ? 'Ripoti za Hivi Karibuni' : 'Recent Briefs'}
              </h3>
              <div className="space-y-3">
                {POLICY_BRIEFS.map((brief) => (
                  <div key={brief.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary/30 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">{brief.title}</p>
                        <p className="text-xs text-muted-foreground">{brief.date}</p>
                      </div>
                    </div>
                    <StatusBadge status={brief.status} />
                  </div>
                ))}
              </div>
            </div>

            {/* Generate New Brief */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                {lang === 'sw' ? 'Tengeneza Ripoti Mpya' : 'Generate New Policy Brief'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    {lang === 'sw' ? 'Mada' : 'Topic'}
                  </label>
                  <input
                    type="text"
                    value={selectedBrief}
                    onChange={(e) => setSelectedBrief(e.target.value)}
                    placeholder={lang === 'sw' ? 'e.g., Utabiri wa Mapato 2025' : 'e.g., Revenue Outlook 2025'}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    {lang === 'sw' ? 'Vyanzo vya Data' : 'Data Sources'}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['KNBS', 'CBK', 'Treasury', 'KRA'].map(source => (
                      <label key={source} className="flex items-center gap-1.5 text-xs">
                        <input type="checkbox" defaultChecked className="rounded border-input text-primary" />
                        {source}
                      </label>
                    ))}
                  </div>
                </div>
                <button
                  onClick={generateBrief}
                  disabled={isGeneratingBrief}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isGeneratingBrief ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      {lang === 'sw' ? 'Inatengeneza...' : 'Generating...'}
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4" />
                      {lang === 'sw' ? 'Tengeneza na AI' : 'Generate with AI'}
                    </>
                  )}
                </button>
              </div>

              {/* Generated Brief Preview */}
              {briefContent && (
                <div className="mt-4 p-4 rounded-lg border border-emerald-200 bg-emerald-50 max-h-60 overflow-y-auto">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-emerald-700">✅ {lang === 'sw' ? 'Ripoti Imeundwa' : 'Brief Generated'}</span>
                    <button className="text-xs text-primary font-medium hover:underline">
                      <Download className="h-3.5 w-3.5 inline mr-1" />
                      {lang === 'sw' ? 'Pakua' : 'Download'}
                    </button>
                  </div>
                  <pre className="text-xs whitespace-pre-wrap font-sans text-foreground/80">
                    {briefContent}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
