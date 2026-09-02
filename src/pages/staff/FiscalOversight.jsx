import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign, TrendingUp, TrendingDown, AlertTriangle,
  Wallet, PieChart as PieIcon, Target, CheckCircle2,
  Brain, Zap, Gauge, Clock, Shield, Radio, Signal,
  ChevronDown, ChevronUp, Play, Save, Download,
  FileText, Bell, Sliders, Activity, Calendar,
  BarChart3, LineChart, Sparkles, RefreshCw,
  ExternalLink, Cloud, Database, HardDrive
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar, LineChart as ReLineChart, Line
} from 'recharts';

// ============================================================
// 1. MOCK DATA - ENHANCED WITH PREDICTIVE AI FEATURES
// ============================================================

// Budget Execution Data
const BUDGET_DATA = [
  { quarter: 'Q1 2024', planned: 85, actual: 78, forecast: 80 },
  { quarter: 'Q2 2024', planned: 92, actual: 88, forecast: 85 },
  { quarter: 'Q3 2024', planned: 88, actual: 71, forecast: 75 },
  { quarter: 'Q4 2024', planned: 95, actual: 82, forecast: 86 },
  { quarter: 'Q1 2025', planned: 90, actual: 84, forecast: 82 },
  { quarter: 'Q2 2025', planned: 93, actual: null, forecast: 79 },
  { quarter: 'Q3 2025', planned: 96, actual: null, forecast: 74 },
];

// Budget Allocation
const ALLOCATION = [
  { name: 'Research Programs', value: 42, color: '#10b981' },
  { name: 'Training & Capacity', value: 18, color: '#3b82f6' },
  { name: 'Administration', value: 22, color: '#f59e0b' },
  { name: 'Infrastructure', value: 12, color: '#8b5cf6' },
  { name: 'International Partnerships', value: 6, color: '#06b6d4' },
];

// Alerts - Enhanced with predictive risk scores
const ALERTS = [
  { 
    project: 'Macroeconomic Modeling Lab', 
    issue: 'Spending at 85% but milestone at 60%', 
    severity: 'high',
    riskScore: 92,
    forecast: 'At risk of 15% overrun by Q4',
    category: 'Expenditure'
  },
  { 
    project: 'County Training Program', 
    issue: 'Underspent by 32% — risk of reallocation', 
    severity: 'medium',
    riskScore: 68,
    forecast: 'Potential reallocation in Q3',
    category: 'Revenue'
  },
  { 
    project: 'SDG Reporting System', 
    issue: 'On track — 92% alignment', 
    severity: 'low',
    riskScore: 25,
    forecast: 'Expected to complete on time',
    category: 'Compliance'
  },
  { 
    project: 'Digital Tax Compliance Unit', 
    issue: 'Revenue collection below target by 8.7%', 
    severity: 'high',
    riskScore: 88,
    forecast: 'Shortfall projected to reach KES 115.3B',
    category: 'Revenue'
  },
];

// Predictive Revenue Forecast
const REVENUE_FORECAST = {
  current: 2.1,
  target: 2.3,
  gap: -0.2,
  gapPercent: -8.7,
  forecast: {
    Q1_2025: 2.15,
    Q2_2025: 2.08,
    Q3_2025: 1.95,
    Q4_2025: 2.22,
  },
  confidence: {
    lower: 1.92,
    upper: 2.38,
  },
  trend: 'decreasing',
  probability: 78,
};

// GDP Nowcast
const GDP_NOWCAST = {
  estimate: 12.4,
  previous: 12.3,
  change: 0.8,
  confidence: [12.2, 12.6],
  status: 'increasing',
  highFrequencySignals: {
    mobileMoney: { value: 345, change: 15, unit: 'Billion KES' },
    fuelConsumption: { value: 4.8, change: 6.7, unit: 'Million Litres' },
    electricity: { value: 2.1, change: 5.0, unit: 'GWh' },
  }
};

// Fiscal Risk Indicators
const FISCAL_RISKS = [
  {
    id: 'debt_gdp',
    name: 'Debt-to-GDP Ratio',
    value: 68.2,
    threshold: 65,
    forecast: 72.5,
    status: 'critical',
    probability: 92,
    trend: 'increasing',
  },
  {
    id: 'inflation',
    name: 'Inflation Rate',
    value: 6.2,
    threshold: 7.5,
    forecast: 7.8,
    status: 'warning',
    probability: 68,
    trend: 'increasing',
  },
  {
    id: 'exchange_rate',
    name: 'Exchange Rate (KES/USD)',
    value: 152.4,
    threshold: 160,
    forecast: 158.2,
    status: 'stable',
    probability: 45,
    trend: 'moderate',
  },
  {
    id: 'revenue_gap',
    name: 'Revenue Collection Gap',
    value: -8.7,
    threshold: -5,
    forecast: -12.3,
    status: 'critical',
    probability: 88,
    trend: 'worsening',
  },
];

// Scenario Simulation Parameters
const SIMULATION_LEVERS = [
  { key: 'exchange_rate', label: 'KES/USD Depreciation (%)', min: -20, max: 20, default: 0, unit: '%' },
  { key: 'interest_rate', label: 'Lending Rate (%)', min: 5, max: 20, default: 10, unit: '%' },
  { key: 'oil_prices', label: 'Global Oil Prices (USD/barrel)', min: 50, max: 150, default: 85, unit: '$' },
  { key: 'revenue_growth', label: 'Revenue Growth Rate (%)', min: -10, max: 20, default: 5, unit: '%' },
];

// Macroeconomic Indicators for Dashboard
const MACRO_INDICATORS = {
  gdp: { value: 5.4, change: 0.2, target: 5.5, status: 'on_track' },
  inflation: { value: 6.2, change: 0.3, target: 5.0, status: 'elevated' },
  revenue: { value: 2.1, change: -0.1, target: 2.3, status: 'below_target' },
  debt: { value: 68.2, change: 1.5, target: 65, status: 'critical' },
};

// High-Frequency Indicators (Nowcasting)
const HIGH_FREQUENCY_DATA = [
  { month: 'Jan', mobileMoney: 320, fuel: 4.2, electricity: 1.9 },
  { month: 'Feb', mobileMoney: 325, fuel: 4.3, electricity: 2.0 },
  { month: 'Mar', mobileMoney: 330, fuel: 4.5, electricity: 2.0 },
  { month: 'Apr', mobileMoney: 335, fuel: 4.6, electricity: 2.1 },
  { month: 'May', mobileMoney: 340, fuel: 4.7, electricity: 2.1 },
  { month: 'Jun', mobileMoney: 345, fuel: 4.8, electricity: 2.1 },
];

// ============================================================
// 2. HELPER COMPONENTS
// ============================================================

const StatusBadge = ({ status }) => {
  const configs = {
    critical: { bg: 'bg-red-100', text: 'text-red-700', label: 'Critical' },
    warning: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Warning' },
    stable: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Stable' },
    on_track: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'On Track' },
    elevated: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Elevated' },
    below_target: { bg: 'bg-red-100', text: 'text-red-700', label: 'Below Target' },
    increasing: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: '↑ Increasing' },
    decreasing: { bg: 'bg-red-100', text: 'text-red-700', label: '↓ Decreasing' },
    worsening: { bg: 'bg-red-100', text: 'text-red-700', label: '↘ Worsening' },
    moderate: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Moderate' },
    low: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Low' },
  };
  const config = configs[status] || configs.stable;
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

const RiskGauge = ({ value, size = 'sm' }) => {
  const getColor = () => {
    if (value >= 70) return 'text-red-500';
    if (value >= 40) return 'text-amber-500';
    return 'text-emerald-500';
  };
  return (
    <div className="flex items-center gap-1.5">
      <div className={`${size === 'sm' ? 'h-1.5 w-16' : 'h-2 w-24'} bg-secondary rounded-full overflow-hidden`}>
        <div 
          className={`h-full rounded-full ${getColor()}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span className={`text-xs font-bold ${getColor()}`}>{value}%</span>
    </div>
  );
};

// ============================================================
// 3. MAIN COMPONENT
// ============================================================

export default function FiscalOversight() {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLevers, setSimulationLevers] = useState(
    Object.fromEntries(SIMULATION_LEVERS.map(l => [l.key, l.default]))
  );
  const [simulationResult, setSimulationResult] = useState(null);
  const [showAIInsights, setShowAIInsights] = useState(true);
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [nowcastData, setNowcastData] = useState(GDP_NOWCAST);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const totalBudget = ALLOCATION.reduce((a, b) => a + b.value, 0);
  const executionRate = Math.round(
    (BUDGET_DATA.filter(d => d.actual !== null).reduce((a, b) => a + b.actual, 0) / 
     BUDGET_DATA.filter(d => d.actual !== null).reduce((a, b) => a + b.planned, 0)) * 100
  );

  // Run Scenario Simulation
  const runSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      const baseline = { 
        deficit: 4.2, 
        gdp: 5.4, 
        inflation: 6.2, 
        debt: 68.2,
        revenue: 2.1,
      };
      
      const impact = {
        exchange_rate: simulationLevers.exchange_rate * 0.08,
        interest_rate: simulationLevers.interest_rate * 0.05,
        oil_prices: (simulationLevers.oil_prices - 85) * 0.02,
        revenue_growth: simulationLevers.revenue_growth * 0.03,
      };
      
      const totalImpact = Object.values(impact).reduce((a, b) => a + b, 0);
      
      setSimulationResult({
        deficit: baseline.deficit + totalImpact * 0.3,
        gdp: baseline.gdp - totalImpact * 0.15,
        inflation: baseline.inflation + totalImpact * 0.1,
        debt: baseline.debt + totalImpact * 0.2,
        revenue: baseline.revenue + totalImpact * 0.12,
        impact: totalImpact,
        baseline,
        confidence: {
          deficit: { lower: baseline.deficit - 0.5, upper: baseline.deficit + 0.5 },
          gdp: { lower: baseline.gdp - 0.3, upper: baseline.gdp + 0.3 },
        }
      });
      setIsSimulating(false);
    }, 1500);
  };

  // Refresh Nowcast
  const refreshNowcast = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      const update = {
        ...nowcastData,
        estimate: nowcastData.estimate + (Math.random() * 0.1 - 0.05),
        mobileMoney: {
          ...nowcastData.highFrequencySignals.mobileMoney,
          value: nowcastData.highFrequencySignals.mobileMoney.value + Math.floor(Math.random() * 10 - 5),
        }
      };
      setNowcastData(update);
      setIsRefreshing(false);
    }, 1000);
  };

  const tabs = [
    { id: 'dashboard', label: lang === 'sw' ? 'Dashibodi' : 'Dashboard', icon: Activity },
    { id: 'nowcasting', label: lang === 'sw' ? 'Uchambuzi wa Wakati Halisi' : 'Nowcasting', icon: Zap },
    { id: 'risks', label: lang === 'sw' ? 'Hatari za Fiskali' : 'Fiscal Risks', icon: Gauge },
    { id: 'scenario', label: lang === 'sw' ? 'Simulizi' : 'Scenario Simulation', icon: Sliders },
    { id: 'forecast', label: lang === 'sw' ? 'Utabiri' : 'Forecast', icon: LineChart },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* ============================================================ */}
      {/* HEADER WITH AI STATUS */}
      {/* ============================================================ */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <DollarSign className="h-6 w-6 text-primary" />
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
            <button 
              onClick={refreshNowcast}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-xs font-medium hover:bg-secondary transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {lang === 'sw' ? 'Sasisha Data' : 'Refresh Data'}
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
              <Shield className="h-3.5 w-3.5" />
              {lang === 'sw' ? 'Vault Auth' : 'Vault Auth'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* ============================================================ */}
      {/* KPI CARDS WITH AI INSIGHTS */}
      {/* ============================================================ */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
      >
        {[
          { 
            label: lang === 'sw' ? 'GDP (Trilioni KES)' : 'GDP (KES Trillion)', 
            value: GDP_NOWCAST.estimate, 
            change: GDP_NOWCAST.change, 
            icon: DollarSign, 
            color: 'text-primary',
            confidence: GDP_NOWCAST.confidence
          },
          { 
            label: lang === 'sw' ? 'Mapato (Trilioni KES)' : 'Revenue (KES Trillion)', 
            value: REVENUE_FORECAST.current, 
            change: REVENUE_FORECAST.gapPercent, 
            icon: Wallet, 
            color: 'text-red-600',
            target: REVENUE_FORECAST.target
          },
          { 
            label: lang === 'sw' ? 'Mfumuko wa Bei (%)' : 'Inflation (%)', 
            value: MACRO_INDICATORS.inflation.value, 
            change: MACRO_INDICATORS.inflation.change, 
            icon: TrendingUp, 
            color: 'text-amber-600',
            status: MACRO_INDICATORS.inflation.status
          },
          { 
            label: lang === 'sw' ? 'Arifa Muhimu' : 'Critical Alerts', 
            value: ALERTS.filter(a => a.severity === 'high').length, 
            icon: AlertTriangle, 
            color: 'text-red-600',
            details: `${ALERTS.filter(a => a.severity === 'high').length} high, ${ALERTS.filter(a => a.severity === 'medium').length} medium`
          },
        ].map((kpi, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className="rounded-2xl border border-border bg-card p-4 lg:p-5 hover:shadow-lg transition-shadow relative"
          >
            <kpi.icon className={`h-5 w-5 ${kpi.color} mb-2`} />
            <div className="flex items-end justify-between">
              <div>
                <div className="font-display text-2xl font-extrabold text-foreground">{kpi.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{kpi.label}</div>
                {kpi.confidence && (
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    ± {((kpi.confidence[1] - kpi.confidence[0]) / 2).toFixed(1)}% CI
                  </div>
                )}
                {kpi.target && (
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Target: {kpi.target}
                  </div>
                )}
              </div>
              {kpi.change !== undefined && (
                <div className={`flex items-center gap-1 text-sm font-semibold ${kpi.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  <TrendIcon value={kpi.change} />
                  {kpi.change > 0 ? '+' : ''}{kpi.change}%
                </div>
              )}
            </div>
            {kpi.details && (
              <div className="text-[10px] text-muted-foreground mt-1">{kpi.details}</div>
            )}
            {kpi.status && (
              <div className="mt-1">
                <StatusBadge status={kpi.status} />
              </div>
            )}
            {/* AI Sparkle */}
            <div className="absolute top-2 right-2">
              <Sparkles className="h-3 w-3 text-primary/40" />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ============================================================ */}
      {/* TABS */}
      {/* ============================================================ */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-6 border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all flex items-center gap-1.5 sm:gap-2
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

      {/* ============================================================ */}
      {/* TAB 1: DASHBOARD */}
      {/* ============================================================ */}
      {activeTab === 'dashboard' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Budget Execution & Allocation */}
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">
                  {lang === 'sw' ? 'Utekelezaji wa Bajeti (KES M)' : 'Budget Execution (KES M)'}
                </h3>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {lang === 'sw' ? 'Utabiri wa Robo Mwaka' : 'Quarterly Forecast'}
                </span>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={BUDGET_DATA}>
                  <defs>
                    <linearGradient id="planGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="forGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(150 15% 90%)" />
                  <XAxis dataKey="quarter" tick={{ fontSize: 10, fill: 'hsl(155 10% 40%)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(155 10% 40%)' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(150 15% 90%)', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Area type="monotone" dataKey="planned" name={lang === 'sw' ? 'Iliyopangwa' : 'Planned'} stroke="#3b82f6" strokeWidth={2} fill="url(#planGrad)" />
                  <Area type="monotone" dataKey="actual" name={lang === 'sw' ? 'Halisi' : 'Actual'} stroke="#10b981" strokeWidth={2} fill="url(#actGrad)" />
                  <Area type="monotone" dataKey="forecast" name={lang === 'sw' ? 'Utabiri' : 'Forecast'} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 4" fill="url(#forGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <PieIcon className="h-4 w-4 text-primary" />
                {lang === 'sw' ? 'Mgawanyo wa Bajeti' : 'Budget Allocation'}
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={ALLOCATION} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}>
                    {ALLOCATION.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(150 15% 90%)', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-center text-xs text-muted-foreground mt-2">
                {lang === 'sw' ? 'Jumla ya Bajeti' : 'Total Budget'}: KES {totalBudget}M
              </div>
            </div>
          </div>

          {/* AI Insights & Alerts */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* AI Insights Panel */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Brain className="h-4 w-4 text-primary" />
                  {lang === 'sw' ? 'Uchambuzi wa AI' : 'AI Insights'}
                </h3>
                <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                  <Signal className="h-3 w-3" />
                  {lang === 'sw' ? 'Inaendelea' : 'Active'}
                </span>
              </div>
              <div className="space-y-3">
                <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-foreground">
                        {lang === 'sw' ? 'Mapato Chini ya Lengo' : 'Revenue Below Target'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {lang === 'sw' 
                          ? `Mapato yako chini ya lengo la BPS kwa KES 115.3B. Utabiri unaonyesha upungufu zaidi wa ${Math.abs(REVENUE_FORECAST.forecast.Q3_2025 - REVENUE_FORECAST.target).toFixed(1)}B katika Q3 2025.`
                          : `Revenue is KES 115.3B below BPS target. Forecast shows further shortfall of ${Math.abs(REVENUE_FORECAST.forecast.Q3_2025 - REVENUE_FORECAST.target).toFixed(1)}B in Q3 2025.`
                        }
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-[10px] text-amber-600 font-medium">
                          {lang === 'sw' ? 'Uaminifu' : 'Confidence'}: 78%
                        </span>
                        <RiskGauge value={78} size="sm" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-foreground">
                        {lang === 'sw' ? 'Ukuaji wa GDP' : 'GDP Growth Signal'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {lang === 'sw'
                          ? `GDP inakadiriwa kuongezeka kwa ${GDP_NOWCAST.change}% katika robo mwaka ijayo, ikiongozwa na shughuli za simu za mkononi (+${GDP_NOWCAST.highFrequencySignals.mobileMoney.change}%) na matumizi ya mafuta (+${GDP_NOWCAST.highFrequencySignals.fuelConsumption.change}%).`
                          : `GDP is projected to grow by ${GDP_NOWCAST.change}% in the next quarter, driven by mobile money activity (+${GDP_NOWCAST.highFrequencySignals.mobileMoney.change}%) and fuel consumption (+${GDP_NOWCAST.highFrequencySignals.fuelConsumption.change}%).`
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-3">
                  <div className="flex items-start gap-2">
                    <Gauge className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-foreground">
                        {lang === 'sw' ? 'Hatari ya Deni kwa GDP' : 'Debt-to-GDP Risk'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {lang === 'sw'
                          ? `Uwiano wa deni kwa GDP unakadiriwa kufikia ${FISCAL_RISKS.find(r => r.id === 'debt_gdp').forecast}% ifikapo 2026, ikizidi kizingiti cha ${FISCAL_RISKS.find(r => r.id === 'debt_gdp').threshold}%.`
                          : `Debt-to-GDP ratio is projected to reach ${FISCAL_RISKS.find(r => r.id === 'debt_gdp').forecast}% by 2026, exceeding the ${FISCAL_RISKS.find(r => r.id === 'debt_gdp').threshold}% threshold.`
                        }
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-[10px] text-red-600 font-medium">
                          {lang === 'sw' ? 'Uwezekano' : 'Probability'}: 92%
                        </span>
                        <RiskGauge value={92} size="sm" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Alerts Feed */}
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Bell className="h-4 w-4 text-amber-600" />
                {lang === 'sw' ? 'Arifa za Hatari' : 'Risk Alerts'}
                <span className="text-xs font-normal text-muted-foreground ml-auto">
                  {ALERTS.filter(a => a.severity === 'high').length} {lang === 'sw' ? 'muhimu' : 'critical'}
                </span>
              </h3>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {ALERTS.map((alert, i) => (
                  <div 
                    key={i} 
                    className={`rounded-lg border p-3 transition-colors cursor-pointer hover:shadow-md
                      ${alert.severity === 'high' ? 'border-red-200 bg-red-50/50 hover:bg-red-50' :
                        alert.severity === 'medium' ? 'border-amber-200 bg-amber-50/50 hover:bg-amber-50' :
                        'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50'
                      }`}
                    onClick={() => setSelectedRisk(alert)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg
                          ${alert.severity === 'high' ? 'bg-red-100 text-red-600' :
                            alert.severity === 'medium' ? 'bg-amber-100 text-amber-600' :
                            'bg-emerald-100 text-emerald-600'
                          }`}
                        >
                          {alert.severity === 'low' ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{alert.project}</p>
                          <p className="text-[10px] text-muted-foreground">{alert.issue}</p>
                          {alert.forecast && (
                            <p className="text-[10px] text-amber-600 font-medium mt-0.5">📊 {alert.forecast}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded
                          ${alert.severity === 'high' ? 'bg-red-100 text-red-700' :
                            alert.severity === 'medium' ? 'bg-amber-100 text-amber-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {alert.severity}
                        </span>
                        {alert.riskScore && (
                          <RiskGauge value={alert.riskScore} size="sm" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* TAB 2: NOWCASTING */}
      {/* ============================================================ */}
      {activeTab === 'nowcasting' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    {lang === 'sw' ? 'Uchambuzi wa GDP wa Wakati Halisi' : 'GDP Nowcast'}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {lang === 'sw' ? 'Makadirio ya robo mwaka kwa kutumia data ya mzunguko wa juu' : 'Quarterly estimate using high-frequency signals'}
                  </p>
                </div>
                <StatusBadge status={GDP_NOWCAST.status} />
              </div>
              <div className="flex items-end gap-4 mb-4">
                <div>
                  <div className="text-3xl font-display font-extrabold text-foreground">
                    KES {GDP_NOWCAST.estimate}T
                  </div>
                  <div className="text-sm text-muted-foreground">
                    ± {((GDP_NOWCAST.confidence[1] - GDP_NOWCAST.confidence[0]) / 2).toFixed(1)}% CI
                  </div>
                </div>
                <div className="flex items-center gap-1 text-emerald-600">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-lg font-bold">+{GDP_NOWCAST.change}%</span>
                  <span className="text-xs text-muted-foreground">vs previous</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="rounded-lg bg-secondary/30 p-3">
                  <div className="text-muted-foreground">{lang === 'sw' ? 'Simu za Mkononi' : 'Mobile Money'}</div>
                  <div className="font-bold text-foreground">KES {GDP_NOWCAST.highFrequencySignals.mobileMoney.value}B</div>
                  <div className="text-emerald-600">+{GDP_NOWCAST.highFrequencySignals.mobileMoney.change}%</div>
                </div>
                <div className="rounded-lg bg-secondary/30 p-3">
                  <div className="text-muted-foreground">{lang === 'sw' ? 'Matumizi ya Mafuta' : 'Fuel Consumption'}</div>
                  <div className="font-bold text-foreground">{GDP_NOWCAST.highFrequencySignals.fuelConsumption.value}M L</div>
                  <div className="text-emerald-600">+{GDP_NOWCAST.highFrequencySignals.fuelConsumption.change}%</div>
                </div>
                <div className="rounded-lg bg-secondary/30 p-3">
                  <div className="text-muted-foreground">{lang === 'sw' ? 'Umeme' : 'Electricity'}</div>
                  <div className="font-bold text-foreground">{GDP_NOWCAST.highFrequencySignals.electricity.value} GWh</div>
                  <div className="text-emerald-600">+{GDP_NOWCAST.highFrequencySignals.electricity.change}%</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Signal className="h-4 w-4 text-primary" />
                {lang === 'sw' ? 'Viashiria vya Mwezi' : 'Monthly Indicators'}
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <ReLineChart data={HIGH_FREQUENCY_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(150 15% 90%)" />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'hsl(155 10% 40%)' }} />
                  <YAxis tick={{ fontSize: 9, fill: 'hsl(155 10% 40%)' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '10px' }} />
                  <Line type="monotone" dataKey="mobileMoney" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Mobile Money" />
                </ReLineChart>
              </ResponsiveContainer>
              <div className="text-center text-[10px] text-muted-foreground mt-1">
                {lang === 'sw' ? 'Mwezi wa Mwisho' : 'Last 6 months'} — {lang === 'sw' ? 'Mwelekeo wa Kuongezeka' : 'Upward trend'}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* TAB 3: FISCAL RISKS */}
      {/* ============================================================ */}
      {activeTab === 'risks' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Gauge className="h-4 w-4 text-primary" />
              {lang === 'sw' ? 'Viashiria vya Hatari ya Fiskali' : 'Fiscal Risk Indicators'}
              <span className="text-xs text-muted-foreground font-normal ml-2">
                {lang === 'sw' ? 'Utabiri wa miezi 6-12' : '6-12 month forecast'}
              </span>
            </h3>
            <div className="space-y-3">
              {FISCAL_RISKS.map((risk) => (
                <div 
                  key={risk.id} 
                  className={`rounded-lg border p-4 transition-all cursor-pointer hover:shadow-md
                    ${risk.status === 'critical' ? 'border-red-200 bg-red-50/50' :
                      risk.status === 'warning' ? 'border-amber-200 bg-amber-50/50' :
                      'border-emerald-200 bg-emerald-50/50'
                    }`}
                  onClick={() => setSelectedRisk(risk)}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg
                        ${risk.status === 'critical' ? 'bg-red-100 text-red-600' :
                          risk.status === 'warning' ? 'bg-amber-100 text-amber-600' :
                          'bg-emerald-100 text-emerald-600'
                        }`}
                      >
                        {risk.status === 'critical' ? <AlertTriangle className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground">{risk.name}</p>
                          <StatusBadge status={risk.status} />
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{lang === 'sw' ? 'Sasa' : 'Current'}: {risk.value}</span>
                          <span>{lang === 'sw' ? 'Kizingiti' : 'Threshold'}: {risk.threshold}</span>
                          <span className="font-medium text-amber-600">
                            {lang === 'sw' ? 'Utabiri' : 'Forecast'}: {risk.forecast}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-bold text-foreground">{risk.probability}%</div>
                        <div className="text-[10px] text-muted-foreground">{lang === 'sw' ? 'Uwezekano' : 'Probability'}</div>
                      </div>
                      <RiskGauge value={risk.probability} size="md" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{lang === 'sw' ? 'Mwelekeo' : 'Trend'}: {risk.trend}</span>
                      <span>{lang === 'sw' ? 'Kiwango cha Hatari' : 'Risk Level'}: {risk.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* TAB 4: SCENARIO SIMULATION */}
      {/* ============================================================ */}
      {activeTab === 'scenario' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid lg:grid-cols-5 gap-6">
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

            <div className="lg:col-span-3 rounded-2xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <LineChart className="h-4 w-4 text-primary" />
                {lang === 'sw' ? 'Matokeo ya Simulizi' : 'Simulation Results'}
                {simulationResult && (
                  <span className="text-[10px] text-muted-foreground font-normal ml-2">
                    {lang === 'sw' ? 'Athari Jumla' : 'Total Impact'}: {simulationResult.impact.toFixed(2)}%
                  </span>
                )}
              </h3>
              {simulationResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="rounded-lg bg-secondary/30 p-3 text-center">
                      <div className="text-xs text-muted-foreground">{lang === 'sw' ? 'Nakisi' : 'Deficit'}</div>
                      <div className="text-lg font-bold text-foreground">{simulationResult.deficit.toFixed(1)}%</div>
                      <div className="text-[10px] text-muted-foreground">
                        Δ: {(simulationResult.deficit - simulationResult.baseline.deficit).toFixed(1)}%
                      </div>
                    </div>
                    <div className="rounded-lg bg-secondary/30 p-3 text-center">
                      <div className="text-xs text-muted-foreground">{lang === 'sw' ? 'Ukuaji wa GDP' : 'GDP Growth'}</div>
                      <div className="text-lg font-bold text-foreground">{simulationResult.gdp.toFixed(1)}%</div>
                      <div className="text-[10px] text-muted-foreground">
                        Δ: {(simulationResult.gdp - simulationResult.baseline.gdp).toFixed(1)}%
                      </div>
                    </div>
                    <div className="rounded-lg bg-secondary/30 p-3 text-center">
                      <div className="text-xs text-muted-foreground">{lang === 'sw' ? 'Mfumuko wa Bei' : 'Inflation'}</div>
                      <div className="text-lg font-bold text-foreground">{simulationResult.inflation.toFixed(1)}%</div>
                      <div className="text-[10px] text-muted-foreground">
                        Δ: {(simulationResult.inflation - simulationResult.baseline.inflation).toFixed(1)}%
                      </div>
                    </div>
                    <div className="rounded-lg bg-secondary/30 p-3 text-center">
                      <div className="text-xs text-muted-foreground">{lang === 'sw' ? 'Deni kwa GDP' : 'Debt-to-GDP'}</div>
                      <div className="text-lg font-bold text-foreground">{simulationResult.debt.toFixed(1)}%</div>
                      <div className="text-[10px] text-muted-foreground">
                        Δ: {(simulationResult.debt - simulationResult.baseline.debt).toFixed(1)}%
                      </div>
                    </div>
                    <div className="rounded-lg bg-secondary/30 p-3 text-center col-span-2 sm:col-span-1">
                      <div className="text-xs text-muted-foreground">{lang === 'sw' ? 'Mapato' : 'Revenue'}</div>
                      <div className="text-lg font-bold text-foreground">{simulationResult.revenue.toFixed(1)}T</div>
                      <div className="text-[10px] text-muted-foreground">
                        Δ: {(simulationResult.revenue - simulationResult.baseline.revenue).toFixed(1)}T
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
                    <p className="text-xs text-muted-foreground">
                      {lang === 'sw'
                        ? `Marekebisho yaliyochaguliwa yana athari ya jumla ya ${simulationResult.impact.toFixed(2)}% kwenye viashiria vya makro-fiskali.`
                        : `Selected adjustments have a total impact of ${simulationResult.impact.toFixed(2)}% on macro-fiscal indicators.`
                      }
                    </p>
                    <div className="mt-1.5 flex items-center gap-3 text-[10px] text-muted-foreground">
                      <span>📊 {lang === 'sw' ? 'Kiwango cha Uaminifu' : 'Confidence Interval'}: ±0.5%</span>
                      <span>🧠 {lang === 'sw' ? 'Utabiri wa AI' : 'AI Forecast'}: {simulationResult.gdp.toFixed(1)}% GDP</span>
                    </div>
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

      {/* ============================================================ */}
      {/* TAB 5: FORECAST */}
      {/* ============================================================ */}
      {activeTab === 'forecast' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <LineChart className="h-4 w-4 text-primary" />
                {lang === 'sw' ? 'Utabiri wa Mapato' : 'Revenue Forecast'}
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">{lang === 'sw' ? 'Sasa' : 'Current'}</div>
                    <div className="text-2xl font-bold text-foreground">KES {REVENUE_FORECAST.current}T</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">{lang === 'sw' ? 'Lengo' : 'Target'}</div>
                    <div className="text-2xl font-bold text-foreground">KES {REVENUE_FORECAST.target}T</div>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div 
                    className="h-full rounded-full bg-red-500"
                    style={{ width: `${Math.min((REVENUE_FORECAST.current / REVENUE_FORECAST.target) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{((REVENUE_FORECAST.current / REVENUE_FORECAST.target) * 100).toFixed(0)}% {lang === 'sw' ? 'ya lengo' : 'of target'}</span>
                  <span className="text-red-600 font-medium">{REVENUE_FORECAST.gapPercent}% {lang === 'sw' ? 'chini ya lengo' : 'below target'}</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(REVENUE_FORECAST.forecast).map(([quarter, value]) => (
                    <div key={quarter} className="rounded-lg bg-secondary/30 p-2 text-center">
                      <div className="text-[10px] text-muted-foreground">{quarter.replace('_', ' ')}</div>
                      <div className="text-sm font-bold text-foreground">{value.toFixed(2)}T</div>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg bg-primary/5 border border-primary/10 p-3">
                  <p className="text-xs text-muted-foreground">
                    {lang === 'sw'
                      ? `Utabiri unaonyesha upungufu wa ${Math.abs(REVENUE_FORECAST.forecast.Q3_2025 - REVENUE_FORECAST.target).toFixed(1)}B katika Q3 2025. Kiwango cha uaminifu: ${REVENUE_FORECAST.confidence.lower.toFixed(2)}T - ${REVENUE_FORECAST.confidence.upper.toFixed(2)}T`
                      : `Forecast shows a shortfall of ${Math.abs(REVENUE_FORECAST.forecast.Q3_2025 - REVENUE_FORECAST.target).toFixed(1)}B in Q3 2025. Confidence interval: ${REVENUE_FORECAST.confidence.lower.toFixed(2)}T - ${REVENUE_FORECAST.confidence.upper.toFixed(2)}T`
                    }
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                {lang === 'sw' ? 'Mapendekezo ya AI' : 'AI Recommendations'}
              </h3>
              <div className="space-y-3">
                <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-3">
                  <div className="flex items-start gap-2">
                    <Target className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-foreground">{lang === 'sw' ? '1. Kuimarisha Ukusanyaji wa Mapato' : '1. Enhance Revenue Collection'}</p>
                      <p className="text-xs text-muted-foreground">
                        {lang === 'sw'
                          ? 'Tekeleza mifumo ya kodi ya kidijitali ili kupunguza pengo la mapato linalokadiriwa kuwa KES 115.3B.'
                          : 'Implement digital tax compliance systems to reduce the projected KES 115.3B revenue gap.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-foreground">{lang === 'sw' ? '2. Kupunguza Matumizi ya Kawaida' : '2. Reduce Recurrent Expenditure'}</p>
                      <p className="text-xs text-muted-foreground">
                        {lang === 'sw'
                          ? 'Tathmini upya vipaumbele vya matumizi ili kupunguza matumizi ya kawaida kwa 6.4%.'
                          : 'Reassess expenditure priorities to reduce recurrent spending by 6.4%.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-foreground">{lang === 'sw' ? '3. Marekebisho ya Bajeti' : '3. Budget Adjustments'}</p>
                      <p className="text-xs text-muted-foreground">
                        {lang === 'sw'
                          ? 'Fikiria marekebisho ya bajeti ya ziada kwa Q3 2025 kulingana na utabiri wa mapato.'
                          : 'Consider supplementary budget adjustments for Q3 2025 based on revenue projections.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-purple-500/5 border border-purple-500/20 p-3">
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-foreground">{lang === 'sw' ? '4. Ufuatiliaji wa Deni' : '4. Debt Monitoring'}</p>
                      <p className="text-xs text-muted-foreground">
                        {lang === 'sw'
                          ? 'Fuatilia kwa karibu uwiano wa deni kwa GDP (inakadiriwa 72.5% ifikapo 2026) na utekeleze mikakati ya kupunguza.'
                          : 'Closely monitor debt-to-GDP ratio (projected 72.5% by 2026) and implement mitigation strategies.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ============================================================ */}
      {/* RISK DETAIL MODAL */}
      {/* ============================================================ */}
      <AnimatePresence>
        {selectedRisk && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedRisk(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card rounded-2xl border border-border max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl
                    ${selectedRisk.status === 'critical' ? 'bg-red-100 text-red-600' :
                      selectedRisk.status === 'warning' ? 'bg-amber-100 text-amber-600' :
                      'bg-emerald-100 text-emerald-600'
                    }`}
                  >
                    {selectedRisk.status === 'critical' ? <AlertTriangle className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">{selectedRisk.name}</h3>
                    <StatusBadge status={selectedRisk.status} />
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRisk(null)}
                  className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-secondary/30 p-3 text-center">
                    <div className="text-xs text-muted-foreground">{lang === 'sw' ? 'Thamani ya Sasa' : 'Current Value'}</div>
                    <div className="text-xl font-bold text-foreground">{selectedRisk.value}</div>
                  </div>
                  <div className="rounded-lg bg-secondary/30 p-3 text-center">
                    <div className="text-xs text-muted-foreground">{lang === 'sw' ? 'Utabiri' : 'Forecast'}</div>
                    <div className="text-xl font-bold text-amber-600">{selectedRisk.forecast}</div>
                  </div>
                  <div className="rounded-lg bg-secondary/30 p-3 text-center">
                    <div className="text-xs text-muted-foreground">{lang === 'sw' ? 'Kizingiti' : 'Threshold'}</div>
                    <div className="text-xl font-bold text-foreground">{selectedRisk.threshold}</div>
                  </div>
                  <div className="rounded-lg bg-secondary/30 p-3 text-center">
                    <div className="text-xs text-muted-foreground">{lang === 'sw' ? 'Uwezekano' : 'Probability'}</div>
                    <div className="text-xl font-bold text-foreground">{selectedRisk.probability}%</div>
                  </div>
                </div>

                <div className="rounded-lg bg-primary/5 border border-primary/10 p-4">
                  <h4 className="text-xs font-semibold text-primary mb-2">
                    {lang === 'sw' ? 'Uchambuzi wa Hatari' : 'Risk Analysis'}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {lang === 'sw'
                      ? `Kiashiria hiki kina ${selectedRisk.probability}% uwezekano wa kuzidi kizingiti katika miezi 12 ijayo. Mwelekeo wa sasa ni "${selectedRisk.trend}" na unahitaji ufuatiliaji wa karibu.`
                      : `This indicator has a ${selectedRisk.probability}% probability of exceeding the threshold in the next 12 months. Current trend is "${selectedRisk.trend}" and requires close monitoring.`
                    }
                  </p>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                    {lang === 'sw' ? 'Tazama Uchambuzi Kamili' : 'View Full Analysis'}
                  </button>
                  <button className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-secondary/50 transition-colors">
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
