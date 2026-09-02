import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu, X, LayoutDashboard, Database, Users, BookOpen,
  MessageSquare, Bell, Settings, HelpCircle, ChevronDown,
  ChevronUp, Search, Filter, Download, Share2, RefreshCw,
  Maximize2, Minimize2, Play, Save, FileText, Calendar,
  Clock, MapPin, Globe, Target, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle2, Shield, Zap, Sparkles,
  DollarSign, Wallet, Activity, Gauge, Radio, Signal,
  Cpu, Network, GitCompare, Layers, ArrowRight,
  Cloud, HardDrive, ExternalLink, User, LogOut,
  Mic, MicOff, Loader2, Eye, EyeOff, Sliders,
  Table2, Grid3x3, Plus, Minus, Trash2, Edit,
  Upload, FolderOpen, Link, MessageCircle, Brain,
  BarChart3, LineChart, GraduationCap, Video, Headphones, Globe2
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart as ReLineChart,
  Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ComposedChart,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, ZAxis
} from 'recharts';

// ============================================================
// 1. MOCK DATA - AI-POWERED KPH
// ============================================================

// AI-Powered Economic Dashboard Data
const ECONOMIC_INDICATORS = {
  gdp: { value: 12.4, change: 5.4, forecast: 12.8, confidence: [12.2, 12.6], status: 'on_track', ai_prediction: 'Growth expected to accelerate in Q3' },
  revenue: { value: 2.1, change: -8.7, forecast: 2.3, confidence: [2.05, 2.15], status: 'below_target', ai_prediction: 'Shortfall may widen to KES 115.3B' },
  inflation: { value: 6.2, change: 0.3, forecast: 5.0, confidence: [5.8, 6.6], status: 'elevated', ai_prediction: 'Pressure expected to ease by Q4' },
  debt: { value: 68.2, change: 1.5, forecast: 65.0, confidence: [67.5, 69.0], status: 'critical', ai_prediction: 'Projected to exceed 70% by 2026' },
  forex: { value: 152.4, change: 2.1, forecast: 155.0, confidence: [151.0, 154.0], status: 'stable', ai_prediction: 'Moderate pressure expected' },
  unemployment: { value: 12.1, change: -0.5, forecast: 10.0, confidence: [11.5, 12.7], status: 'warning', ai_prediction: 'Slight improvement expected' },
};

// AI-Generated Policy Recommendations
const AI_RECOMMENDATIONS = [
  { 
    id: 1, 
    title: 'Revenue Enhancement Strategy', 
    description: 'AI analysis suggests implementing digital tax compliance systems to reduce KES 115.3B revenue gap.',
    confidence: 92,
    impact: 'High',
    urgency: 'Critical',
    category: 'Revenue',
    actions: ['Deploy e-TIMS nationwide', 'Enhance data sharing with KRA', 'Automate tax filing']
  },
  { 
    id: 2, 
    title: 'Debt Sustainability Plan', 
    description: 'Debt-to-GDP projected at 72.5% by 2026. Implement fiscal consolidation measures.',
    confidence: 88,
    impact: 'High',
    urgency: 'High',
    category: 'Debt',
    actions: ['Review expenditure priorities', 'Enhance revenue collection', 'Explore PPP options']
  },
  { 
    id: 3, 
    title: 'Inflation Management Strategy', 
    description: 'Food inflation at 8.4% exceeds threshold. Implement supply-side interventions.',
    confidence: 78,
    impact: 'Medium',
    urgency: 'Medium',
    category: 'Inflation',
    actions: ['Boost food production', 'Enhance market integration', 'Monitor price controls']
  },
  { 
    id: 4, 
    title: 'County Revenue Optimization', 
    description: 'County revenue collection gap of 32% identified. Implement performance-based allocation.',
    confidence: 85,
    impact: 'High',
    urgency: 'High',
    category: 'County',
    actions: ['Capacity building for county treasuries', 'Automate revenue collection', 'Enhance accountability']
  },
];

// AI Chat Conversations
const AI_CONVERSATIONS = [
  { 
    id: 1, 
    user: 'Dr. Jane Mwangi', 
    query: 'What is the projected GDP growth for Q3 2025?', 
    response: 'Based on current high-frequency signals (mobile money +15%, fuel consumption +6.7%), GDP is projected to grow by 5.4% in Q3 2025. Confidence interval: 5.2% - 5.6%. Key drivers: services sector expansion and agricultural recovery.',
    timestamp: '2025-02-28T10:30:00',
    confidence: 92,
    citations: ['KNBS GDP Nowcast', 'CBK Economic Indicators']
  },
  { 
    id: 2, 
    user: 'Mr. James Kariuki', 
    query: 'How can counties improve revenue collection?', 
    response: 'AI analysis reveals county revenue collection gap of 32%. Recommendations: 1) Automate revenue collection systems, 2) Implement GIS-based property tax, 3) Enhance single business permit collection, 4) Capacity building for county treasury staff. Estimated additional revenue: KES 15B annually.',
    timestamp: '2025-02-28T09:15:00',
    confidence: 85,
    citations: ['KIPPRA County Revenue Study 2024', 'CBK Financial Inclusion Report']
  },
];

// Policy Briefs (AI-Generated)
const POLICY_BRIEFS = [
  {
    id: 1,
    title: 'Economic Outlook 2025',
    ai_generated: true,
    summary: 'AI-generated outlook: GDP growth 5.4%, inflation easing to 5.5%, revenue shortfall persists.',
    date: '2025-02-28',
    status: 'Published',
    confidence: 89,
    topics: ['GDP', 'Inflation', 'Revenue'],
  },
  {
    id: 2,
    title: 'County Performance Index',
    ai_generated: true,
    summary: 'AI analysis of 47 counties: Nairobi leads economic output, 12 counties show significant improvement.',
    date: '2025-02-27',
    status: 'Draft',
    confidence: 82,
    topics: ['County', 'Performance', 'Benchmarking'],
  },
  {
    id: 3,
    title: 'Fiscal Risk Assessment',
    ai_generated: true,
    summary: 'AI identifies 5 critical fiscal risks: debt sustainability, revenue shortfall, inflation pressure.',
    date: '2025-02-26',
    status: 'Pending Review',
    confidence: 91,
    topics: ['Fiscal', 'Risk', 'Sustainability'],
  },
];

// Communities of Practice (AI-Moderated)
const COMMUNITIES = [
  {
    id: 1,
    name: 'County Treasurers',
    members: 47,
    active: 32,
    topics: ['Revenue', 'Budget', 'Accountability'],
    ai_moderated: true,
    recent_activity: 'Discussion on automated revenue collection',
    sentiment: 85,
  },
  {
    id: 2,
    name: 'Economic Policy Analysts',
    members: 156,
    active: 89,
    topics: ['Macroeconomics', 'Modelling', 'Forecasting'],
    ai_moderated: true,
    recent_activity: 'AI-assisted model comparison workshop',
    sentiment: 92,
  },
  {
    id: 3,
    name: 'Budget Officers',
    members: 78,
    active: 45,
    topics: ['Budget Planning', 'Execution', 'Monitoring'],
    ai_moderated: true,
    recent_activity: 'Budget performance analysis with AI tools',
    sentiment: 78,
  },
];

// AI-Generated Training Programs
const TRAINING_PROGRAMS = [
  {
    id: 1,
    name: 'AI-Powered Policy Analysis',
    duration: '5 days',
    price: 'KES 85,000',
    spots: 12,
    level: 'Advanced',
    ai_enhanced: true,
    skills: ['AI Literacy', 'Data Analysis', 'Policy Modelling'],
    certificate: 'AI Policy Analyst',
  },
  {
    id: 2,
    name: 'Data-Driven Economic Forecasting',
    duration: '5 days',
    price: 'KES 75,000',
    spots: 8,
    level: 'Intermediate',
    ai_enhanced: true,
    skills: ['Machine Learning', 'Forecasting', 'Economic Modeling'],
    certificate: 'Economic Forecaster',
  },
  {
    id: 3,
    name: 'Public Policy Research with AI',
    duration: '3 days',
    price: 'KES 55,000',
    spots: 15,
    level: 'Beginner',
    ai_enhanced: true,
    skills: ['Research Methods', 'AI Tools', 'Policy Analysis'],
    certificate: 'AI Research Analyst',
  },
];

// Stakeholder Engagement Data
const STAKEHOLDER_ENGAGEMENT = {
  total: 1234,
  active: 567,
  new: 89,
  sentiment: 78,
  top_topics: ['Revenue', 'GDP', 'Inflation', 'Debt', 'County Development'],
};

// AI Sentiment Analysis
const SENTIMENT_DATA = [
  { month: 'Oct', positive: 65, neutral: 25, negative: 10 },
  { month: 'Nov', positive: 68, neutral: 22, negative: 10 },
  { month: 'Dec', positive: 72, neutral: 20, negative: 8 },
  { month: 'Jan', positive: 70, neutral: 22, negative: 8 },
  { month: 'Feb', positive: 75, neutral: 18, negative: 7 },
];

// Data Sources (AI-Integrated)
const DATA_SOURCES = [
  { name: 'KNBS', status: 'Connected', lastSync: '2025-02-28', records: 12500, ai_enhanced: true },
  { name: 'CBK', status: 'Connected', lastSync: '2025-02-27', records: 8400, ai_enhanced: true },
  { name: 'National Treasury', status: 'Connected', lastSync: '2025-02-26', records: 5600, ai_enhanced: true },
  { name: 'KRA', status: 'Syncing', lastSync: '2025-02-25', records: 3200, ai_enhanced: true },
  { name: 'CAK', status: 'Connected', lastSync: '2025-02-24', records: 1800, ai_enhanced: true },
];

// ============================================================
// 2. HELPER COMPONENTS
// ============================================================

const StatusBadge = ({ status, size = 'sm' }) => {
  const configs = {
    critical: { bg: 'bg-red-100', text: 'text-red-700', label: 'Critical' },
    warning: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Warning' },
    stable: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Stable' },
    on_track: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'On Track' },
    elevated: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Elevated' },
    below_target: { bg: 'bg-red-100', text: 'text-red-700', label: 'Below Target' },
    Published: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Published' },
    Draft: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Draft' },
    'Pending Review': { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending Review' },
    High: { bg: 'bg-red-100', text: 'text-red-700', label: 'High' },
    Medium: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Medium' },
    Low: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Low' },
  };
  const config = configs[status] || configs.stable;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  return (
    <span className={`rounded-full font-medium ${config.bg} ${config.text} ${sizeClasses}`}>
      {config.label}
    </span>
  );
};

const TrendIcon = ({ value, size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
  if (value > 0) return <TrendingUp className={`${sizeClass} text-emerald-500`} />;
  if (value < 0) return <TrendingDown className={`${sizeClass} text-red-500`} />;
  return <Minus className={`${sizeClass} text-muted-foreground`} />;
};

const ConfidenceGauge = ({ value, size = 'sm', showLabel = true }) => {
  const getColor = () => {
    if (value >= 80) return 'text-emerald-500';
    if (value >= 60) return 'text-amber-500';
    return 'text-red-500';
  };
  const getBgColor = () => {
    if (value >= 80) return 'bg-emerald-500';
    if (value >= 60) return 'bg-amber-500';
    return 'bg-red-500';
  };
  const width = size === 'sm' ? 'w-16' : size === 'lg' ? 'w-32' : 'w-24';
  const height = size === 'sm' ? 'h-1.5' : 'h-2';
  return (
    <div className="flex items-center gap-1.5">
      <div className={`${width} ${height} bg-secondary rounded-full overflow-hidden`}>
        <div 
          className={`h-full rounded-full ${getBgColor()}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      {showLabel && (
        <span className={`text-xs font-bold ${getColor()}`}>{value}%</span>
      )}
    </div>
  );
};

// ============================================================
// 3. MAIN COMPONENT
// ============================================================

export default function AIPoweredKPH() {
  const { lang } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState([]);
  const [isAILoading, setIsAILoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [selectedBrief, setSelectedBrief] = useState(null);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [aiQueryMode, setAiQueryMode] = useState('general');

  // Check mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) setSidebarOpen(false);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize AI chat with welcome message
  useEffect(() => {
    if (aiMessages.length === 0) {
      setAiMessages([
        {
          role: 'assistant',
          content: '👋 Welcome to KIPPRA AI Policy Assistant! I\'m here to help you with economic policy analysis, data insights, and recommendations. Ask me anything about Kenya\'s economy, fiscal policy, or specific indicators.',
          timestamp: new Date().toISOString(),
        }
      ]);
    }
  }, []);

  // Navigation items
  const navItems = [
    { id: 'dashboard', label: lang === 'sw' ? 'Dashibodi' : 'Dashboard', icon: LayoutDashboard },
    { id: 'analytics', label: lang === 'sw' ? 'Uchambuzi' : 'Analytics', icon: LineChart },
    { id: 'recommendations', label: lang === 'sw' ? 'Mapendekezo' : 'Recommendations', icon: Target },
    { id: 'briefs', label: lang === 'sw' ? 'Ripoti' : 'Policy Briefs', icon: FileText },
    { id: 'community', label: lang === 'sw' ? 'Jumuiya' : 'Communities', icon: Users },
    { id: 'training', label: lang === 'sw' ? 'Mafunzo' : 'Training', icon: GraduationCap },
    { id: 'stakeholders', label: lang === 'sw' ? 'Wadau' : 'Stakeholders', icon: MessageSquare },
  ];

  // Handle AI Chat
  const handleAISend = async () => {
    if (!aiInput.trim()) return;
    
    const userMessage = { 
      role: 'user', 
      content: aiInput, 
      timestamp: new Date().toISOString() 
    };
    setAiMessages(prev => [...prev, userMessage]);
    setAiInput('');
    setIsAILoading(true);

    // Simulate AI response with Kenya-specific economic analysis
    setTimeout(() => {
      const responses = [
        {
          content: `📊 **Economic Analysis for Kenya**\n\nBased on current indicators:\n• GDP: KES 12.4T (5.4% growth)\n• Revenue: KES 2.1T (8.7% below target)\n• Inflation: 6.2% (elevated but manageable)\n• Debt-to-GDP: 68.2% (exceeds threshold)\n\n**AI Recommendation:** Focus on revenue enhancement through digital tax compliance and expenditure rationalization.`,
          confidence: 92,
          citations: ['KIPPRA Economic Report 2024', 'KNBS Quarterly GDP']
        },
        {
          content: `🏛️ **Fiscal Policy Recommendation**\n\nBased on AI analysis of Kenya's fiscal position:\n\n1. **Revenue Gap**: Implement e-TIMS nationwide to capture informal sector\n2. **Expenditure**: Reduce recurrent spending by 6.4% through efficiency measures\n3. **Debt**: Explore PPP options for infrastructure to reduce direct borrowing\n\n**Expected Impact**: 2-3% improvement in fiscal balance within 12 months.`,
          confidence: 88,
          citations: ['KIPPRA Fiscal Policy Study', 'Treasury Budget Statement']
        },
        {
          content: `📈 **County Performance Insights**\n\nAI analysis of 47 counties:\n\n🏆 **Top Performers**:\n• Nairobi: GDP KES 4.2T, Revenue KES 120B\n• Kiambu: GDP KES 2.1T, Revenue KES 65B\n• Mombasa: GDP KES 2.3T, Revenue KES 58B\n\n📉 **Areas for Improvement**:\n• Revenue collection automation\n• Budget execution rate\n• Health & education outcomes\n\n**AI Suggestion**: Benchmark against top performers and adopt best practices.`,
          confidence: 85,
          citations: ['KIPPRA County Performance Index', 'CBK County Statistics']
        },
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      setAiMessages(prev => [...prev, {
        role: 'assistant',
        content: randomResponse.content,
        timestamp: new Date().toISOString(),
        confidence: randomResponse.confidence,
        citations: randomResponse.citations,
      }]);
      setIsAILoading(false);
    }, 1500);
  };

  // Handle AI Quick Actions
  const handleAIQuickAction = (query) => {
    setAiInput(query);
    setTimeout(() => handleAISend(), 100);
  };

  // Notification bell
  const notifications = [
    { id: 1, title: 'AI Alert: Revenue Shortfall', message: 'Revenue collection 8.7% below target. AI recommends immediate action.', time: '2 hours ago', type: 'critical', ai_generated: true },
    { id: 2, title: 'AI Insight: GDP Growth', message: 'GDP nowcast updated to 5.4% growth. Higher than previous estimate.', time: '4 hours ago', type: 'info', ai_generated: true },
    { id: 3, title: 'AI Warning: Debt Risk', message: 'Debt-to-GDP projected to exceed 70% by 2026. Urgent action required.', time: '6 hours ago', type: 'warning', ai_generated: true },
    { id: 4, title: 'New Policy Brief Generated', message: 'AI-generated Economic Outlook 2025 now available for review.', time: '1 day ago', type: 'success', ai_generated: true },
  ];

  // Render Dashboard
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* AI Status Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-emerald-500/10 border border-primary/20 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-500">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {lang === 'sw' ? 'Mfumo wa AI Umewashwa' : 'AI System Active'}
            </h3>
            <p className="text-xs text-muted-foreground">
              {lang === 'sw' 
                ? 'AI inachambua viashiria vya uchumi kwa wakati halisi, inatoa mapendekezo, na kutambua hatari. Uaminifu wa sasa: 89%'
                : 'AI is analyzing real-time economic indicators, generating recommendations, and identifying risks. Current confidence: 89%'}
            </p>
            <div className="mt-2 flex items-center gap-3">
              <span className="flex items-center gap-1 text-xs text-emerald-600">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                {lang === 'sw' ? 'Inafanya kazi' : 'Operational'}
              </span>
              <ConfidenceGauge value={89} size="sm" />
              <span className="text-xs text-muted-foreground">89% {lang === 'sw' ? 'uaminifu' : 'confidence'}</span>
            </div>
          </div>
          <button className="ml-auto shrink-0 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
            {lang === 'sw' ? 'Tazama Mpangilio' : 'View Dashboard'}
          </button>
        </div>
      </div>

      {/* KPI Cards with AI Predictions */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Object.entries(ECONOMIC_INDICATORS).map(([key, indicator], i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-border bg-card p-4 hover:shadow-lg transition-shadow relative group"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs text-muted-foreground capitalize">{key}</div>
                <div className="font-display text-xl font-extrabold text-foreground">{indicator.value}</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <TrendIcon value={indicator.change} size="sm" />
                  <span className={`text-xs font-medium ${indicator.change >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {indicator.change > 0 ? '+' : ''}{indicator.change}%
                  </span>
                </div>
              </div>
              <StatusBadge status={indicator.status} size="sm" />
            </div>
            <div className="mt-2 text-[10px] text-muted-foreground">
              AI: {indicator.ai_prediction}
            </div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Sparkles className="h-3 w-3 text-primary/60" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* AI Insights & Sentiment */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" />
            {lang === 'sw' ? 'Uchambuzi wa AI' : 'AI Insights'}
          </h3>
          <div className="space-y-3">
            <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3">
              <div className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-foreground">{lang === 'sw' ? 'Ukuaji wa GDP' : 'GDP Growth Signal'}</p>
                  <p className="text-xs text-muted-foreground">AI predicts 5.4% GDP growth in Q3 2025 driven by services sector expansion and agricultural recovery. Mobile money transactions up 15% signals strong economic activity.</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-[10px] text-emerald-600 font-medium">{lang === 'sw' ? 'Uaminifu' : 'Confidence'}: 92%</span>
                    <ConfidenceGauge value={92} size="sm" />
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-foreground">{lang === 'sw' ? 'Hatari ya Mapato' : 'Revenue Risk Alert'}</p>
                  <p className="text-xs text-muted-foreground">AI analysis shows revenue gap of KES 115.3B. Urgent recommendation: Implement digital tax compliance across all counties to capture informal sector revenue.</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-[10px] text-amber-600 font-medium">{lang === 'sw' ? 'Uaminifu' : 'Confidence'}: 88%</span>
                    <ConfidenceGauge value={88} size="sm" />
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-3">
              <div className="flex items-start gap-2">
                <Gauge className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-foreground">{lang === 'sw' ? 'Utabiri wa Deni' : 'Debt Sustainability Forecast'}</p>
                  <p className="text-xs text-muted-foreground">AI model projects debt-to-GDP ratio reaching 72.5% by 2026. Scenario analysis suggests fiscal consolidation measures could reduce this to 68%.</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="text-[10px] text-blue-600 font-medium">{lang === 'sw' ? 'Uaminifu' : 'Confidence'}: 85%</span>
                    <ConfidenceGauge value={85} size="sm" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            {lang === 'sw' ? 'AI Recommendations' : 'AI Recommendations'}
          </h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {AI_RECOMMENDATIONS.slice(0, 3).map((rec) => (
              <div 
                key={rec.id} 
                className="rounded-lg border border-border p-3 hover:bg-secondary/30 transition-colors cursor-pointer"
                onClick={() => setSelectedRecommendation(rec)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-foreground">{rec.title}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">{rec.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={rec.urgency} size="sm" />
                      <span className="text-[10px] text-muted-foreground">Impact: {rec.impact}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <ConfidenceGauge value={rec.confidence} size="sm" />
                    <span className="text-[9px] text-muted-foreground">{rec.confidence}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={() => setActiveTab('recommendations')}
            className="mt-3 w-full py-1.5 text-xs text-primary font-medium hover:underline"
          >
            {lang === 'sw' ? 'Tazama Mapendekezo Yote' : 'View All Recommendations'} →
          </button>
        </div>
      </div>

      {/* Sentiment & Engagement */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            {lang === 'sw' ? 'Uchambuzi wa Hisia' : 'Sentiment Analysis'}
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={SENTIMENT_DATA}>
              <defs>
                <linearGradient id="positiveGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="negativeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(150 15% 90%)" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(155 10% 40%)' }} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(155 10% 40%)' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(150 15% 90%)', fontSize: '10px' }} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Area type="monotone" dataKey="positive" name="Positive" stroke="#10b981" fill="url(#positiveGrad)" />
              <Area type="monotone" dataKey="neutral" name="Neutral" stroke="#f59e0b" fill="none" />
              <Area type="monotone" dataKey="negative" name="Negative" stroke="#ef4444" fill="url(#negativeGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            {lang === 'sw' ? 'Wadau Wanaojishughulisha' : 'Stakeholder Engagement'}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-secondary/30 p-3 text-center">
              <div className="text-2xl font-bold text-foreground">{STAKEHOLDER_ENGAGEMENT.total}</div>
              <div className="text-xs text-muted-foreground">{lang === 'sw' ? 'Jumla ya Wadau' : 'Total Stakeholders'}</div>
            </div>
            <div className="rounded-lg bg-secondary/30 p-3 text-center">
              <div className="text-2xl font-bold text-emerald-600">{STAKEHOLDER_ENGAGEMENT.active}</div>
              <div className="text-xs text-muted-foreground">{lang === 'sw' ? 'Wanaofanya kazi' : 'Active'}</div>
            </div>
            <div className="rounded-lg bg-secondary/30 p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{STAKEHOLDER_ENGAGEMENT.new}</div>
              <div className="text-xs text-muted-foreground">{lang === 'sw' ? 'Wapya' : 'New'}</div>
            </div>
            <div className="rounded-lg bg-secondary/30 p-3 text-center">
              <div className="text-2xl font-bold text-emerald-600">{STAKEHOLDER_ENGAGEMENT.sentiment}%</div>
              <div className="text-xs text-muted-foreground">{lang === 'sw' ? 'Hisia' : 'Sentiment'}</div>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xs text-muted-foreground">{lang === 'sw' ? 'Mada zinazojadiliwa' : 'Top Discussion Topics'}:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {STAKEHOLDER_ENGAGEMENT.top_topics.map((topic) => (
                <span key={topic} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Analytics
  const renderAnalytics = () => (
    <div className="space-y-6">
      {/* Data Sources with AI Status */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Database className="h-4 w-4 text-primary" />
          {lang === 'sw' ? 'Vyanzo vya Data (AI imewashwa)' : 'Data Sources (AI-Enhanced)'}
        </h3>
        <div className="space-y-2">
          {DATA_SOURCES.map((source) => (
            <div key={source.name} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${source.ai_enhanced ? 'bg-primary/10' : 'bg-secondary/30'}`}>
                  <Database className={`h-4 w-4 ${source.ai_enhanced ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{source.name}</span>
                    {source.ai_enhanced && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        AI Enhanced
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{source.records.toLocaleString()} records</span>
                    <span>•</span>
                    <span>Last sync: {source.lastSync}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${source.status === 'Connected' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {source.status}
                </span>
                {source.status === 'Connected' && (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Analytics Chart */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            {lang === 'sw' ? 'Uchambuzi wa Viashiria' : 'Indicator Analysis'}
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={COUNTY_DATA || [
              { county: 'Nairobi', gdp: 4.2, revenue: 120 },
              { county: 'Kiambu', gdp: 2.1, revenue: 65 },
              { county: 'Mombasa', gdp: 2.3, revenue: 58 },
              { county: 'Kisumu', gdp: 1.8, revenue: 52 },
              { county: 'Nakuru', gdp: 1.6, revenue: 45 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(150 15% 90%)" />
              <XAxis dataKey="county" tick={{ fontSize: 10, fill: 'hsl(155 10% 40%)' }} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: 'hsl(155 10% 40%)' }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: 'hsl(155 10% 40%)' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(150 15% 90%)', fontSize: '10px' }} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Bar yAxisId="left" dataKey="gdp" fill="#10b981" name="GDP (KES T)" radius={[4, 4, 0, 0]} />
              <Bar yAxisId="right" dataKey="revenue" fill="#3b82f6" name="Revenue (KES B)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Radar className="h-4 w-4 text-primary" />
            {lang === 'sw' ? 'Ulinganisho wa Viashiria' : 'Indicator Comparison'}
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={[
              { subject: 'GDP Growth', A: 5.4, B: 4.2 },
              { subject: 'Revenue', A: 2.1, B: 2.8 },
              { subject: 'Inflation', A: 6.2, B: 5.5 },
              { subject: 'Debt Ratio', A: 68.2, B: 62.0 },
              { subject: 'Employment', A: 12.1, B: 10.5 },
            ]}>
              <PolarGrid stroke="hsl(150 15% 90%)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: 'hsl(155 10% 40%)' }} />
              <PolarRadiusAxis tick={{ fontSize: 9, fill: 'hsl(155 10% 40%)' }} />
              <Radar name="Current" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
              <Radar name="Target" dataKey="B" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(150 15% 90%)', fontSize: '10px' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  // Render Recommendations
  const renderRecommendations = () => (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {AI_RECOMMENDATIONS.map((rec) => (
          <div 
            key={rec.id} 
            className="rounded-2xl border border-border bg-card p-5 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedRecommendation(rec)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-foreground">{rec.title}</h3>
                  <StatusBadge status={rec.urgency} size="sm" />
                </div>
                <p className="text-xs text-muted-foreground">{rec.description}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-muted-foreground">Impact: {rec.impact}</span>
                  <span className="text-xs text-muted-foreground">Category: {rec.category}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {rec.actions.map((action, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/50 text-muted-foreground">
                      {action}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 ml-4">
                <ConfidenceGauge value={rec.confidence} size="sm" />
                <span className="text-[10px] text-muted-foreground">{rec.confidence}% confidence</span>
                <button className="mt-1 px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
                  {lang === 'sw' ? 'Tazama' : 'View'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Render Policy Briefs
  const renderBriefs = () => (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {POLICY_BRIEFS.map((brief) => (
          <div 
            key={brief.id} 
            className="rounded-2xl border border-border bg-card p-5 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedBrief(brief)}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-foreground">{brief.title}</h3>
                  {brief.ai_generated && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                      <Sparkles className="h-2.5 w-2.5" />
                      AI Generated
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{brief.summary}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">{brief.date}</span>
                  <StatusBadge status={brief.status} size="sm" />
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {brief.topics.map((topic) => (
                    <span key={topic} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/50 text-muted-foreground">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <ConfidenceGauge value={brief.confidence} size="sm" />
                <span className="text-[10px] text-muted-foreground">{brief.confidence}% confidence</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Render Communities
  const renderCommunity = () => (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {COMMUNITIES.map((community) => (
          <div 
            key={community.id} 
            className="rounded-2xl border border-border bg-card p-5 hover:shadow-lg transition-shadow"
            onClick={() => setSelectedCommunity(community)}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{community.name}</h3>
                  {community.ai_moderated && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                      <Brain className="h-2.5 w-2.5" />
                      AI Moderated
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {community.members} members
                  </span>
                  <span className="flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    {community.active} active
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{community.recent_activity}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {community.topics.map((topic) => (
                    <span key={topic} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/50 text-muted-foreground">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">Sentiment:</span>
                  <span className={`text-xs font-medium ${community.sentiment >= 80 ? 'text-emerald-600' : community.sentiment >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                    {community.sentiment}%
                  </span>
                </div>
                <ConfidenceGauge value={community.sentiment} size="sm" />
                <button className="mt-1 px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
                  {lang === 'sw' ? 'Jiunge' : 'Join'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Render Training
  const renderTraining = () => (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-2 gap-6">
        {TRAINING_PROGRAMS.map((program) => (
          <div key={program.id} className="rounded-2xl border border-border bg-card p-5 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{program.name}</h3>
                  {program.ai_enhanced && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                      <Brain className="h-2.5 w-2.5" />
                      AI Enhanced
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <span>{program.duration}</span>
                  <span>•</span>
                  <span className="font-medium text-foreground">{program.price}</span>
                  <span>•</span>
                  <span>{program.spots} spots</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {program.skills.map((skill) => (
                    <span key={skill} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary/50 text-muted-foreground">
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="mt-2">
                  <span className="text-[10px] text-muted-foreground">Certificate: {program.certificate}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={program.level} size="sm" />
                <button className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
                  {lang === 'sw' ? 'Omba' : 'Apply'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          {lang === 'sw' ? 'Ratiba ya Mafunzo' : 'Training Schedule'}
        </h3>
        <div className="space-y-2">
          {[
            { course: 'AI-Powered Policy Analysis', date: '2025-03-10', time: '9:00 AM', location: 'Online', spots: 12 },
            { course: 'Data-Driven Economic Forecasting', date: '2025-03-17', time: '10:00 AM', location: 'KIPPRA HQ', spots: 8 },
            { course: 'Public Policy Research with AI', date: '2025-03-24', time: '2:00 PM', location: 'Online', spots: 15 },
          ].map((session, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">{session.course}</p>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                  <span>{session.date}</span>
                  <span>•</span>
                  <span>{session.time}</span>
                  <span>•</span>
                  <span>{session.location}</span>
                  <span>•</span>
                  <span>{session.spots} spots</span>
                </div>
              </div>
              <button className="px-3 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
                {lang === 'sw' ? 'Jisajili' : 'Register'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render Stakeholders
  const renderStakeholders = () => (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          {lang === 'sw' ? 'Mazungumzo ya AI' : 'AI Conversations'}
        </h3>
        <div className="space-y-4">
          {AI_CONVERSATIONS.map((conv) => (
            <div key={conv.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{conv.user}</span>
                    <span className="text-xs text-muted-foreground">{new Date(conv.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">Q: {conv.query}</p>
                  <div className="mt-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <p className="text-xs text-foreground">{conv.response}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground">Confidence:</span>
                        <ConfidenceGauge value={conv.confidence} size="sm" />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground">Sources:</span>
                        {conv.citations.map((cite, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary/50 text-muted-foreground">
                            {cite}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render AI Chat Panel
  const renderAIChat = () => (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="fixed bottom-4 right-4 w-96 max-w-[calc(100vw-2rem)] bg-card rounded-2xl border border-border shadow-2xl z-50 flex flex-col max-h-[80vh]"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-500">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="text-sm font-semibold text-foreground">AI Policy Assistant</span>
            <div className="flex items-center gap-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] text-muted-foreground">Active</span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsAIChatOpen(false)}
          className="p-1 rounded-lg hover:bg-secondary/50 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-2 border-b border-border flex flex-wrap gap-1">
        {[
          { label: 'GDP Growth', query: 'What is the projected GDP growth for Kenya?' },
          { label: 'Revenue Gap', query: 'How can we close the revenue gap?' },
          { label: 'County Performance', query: 'Which counties are performing best?' },
          { label: 'Inflation', query: 'What is the inflation outlook?' },
        ].map((action) => (
          <button
            key={action.label}
            onClick={() => {
              setAiInput(action.query);
              setTimeout(handleAISend, 100);
            }}
            className="text-[9px] px-2 py-1 rounded-full bg-secondary/50 hover:bg-secondary text-muted-foreground transition-colors"
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px]">
        {aiMessages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
              msg.role === 'user' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary/50 text-foreground'
            }`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
              {msg.confidence && (
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="text-[9px] opacity-70">Confidence:</span>
                  <ConfidenceGauge value={msg.confidence} size="sm" />
                </div>
              )}
              {msg.citations && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {msg.citations.map((cite, i) => (
                    <span key={i} className="text-[8px] px-1.5 py-0.5 rounded-full bg-secondary/30 opacity-70">
                      {cite}
                    </span>
                  ))}
                </div>
              )}
              {msg.timestamp && (
                <div className="mt-0.5 text-[8px] opacity-40">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        ))}
        {isAILoading && (
          <div className="flex justify-start">
            <div className="bg-secondary/50 rounded-lg px-3 py-2 text-xs flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span className="text-muted-foreground">Analyzing...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border flex gap-2">
        <input
          type="text"
          value={aiInput}
          onChange={(e) => setAiInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAISend()}
          placeholder="Ask about economic policy..."
          className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          onClick={handleAISend}
          disabled={!aiInput.trim() || isAILoading}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50 transition-colors hover:bg-primary/90"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );

  // Recommendation Detail Modal
  const renderRecommendationModal = () => (
    <AnimatePresence>
      {selectedRecommendation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedRecommendation(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card rounded-2xl border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{selectedRecommendation.title}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StatusBadge status={selectedRecommendation.urgency} />
                    <span className="text-xs text-muted-foreground">Impact: {selectedRecommendation.impact}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedRecommendation(null)}
                className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Description</h4>
                <p className="text-sm text-muted-foreground mt-1">{selectedRecommendation.description}</p>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground">Actions</h4>
                <ul className="mt-1 space-y-1">
                  {selectedRecommendation.actions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary">•</span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-secondary/30 p-3 text-center">
                  <div className="text-xs text-muted-foreground">AI Confidence</div>
                  <div className="text-lg font-bold text-foreground">{selectedRecommendation.confidence}%</div>
                  <ConfidenceGauge value={selectedRecommendation.confidence} size="md" />
                </div>
                <div className="rounded-lg bg-secondary/30 p-3 text-center">
                  <div className="text-xs text-muted-foreground">Category</div>
                  <div className="text-lg font-bold text-foreground">{selectedRecommendation.category}</div>
                  <div className="text-xs text-muted-foreground">Impact: {selectedRecommendation.impact}</div>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                  {lang === 'sw' ? 'Tengeneza Ripoti' : 'Generate Report'}
                </button>
                <button className="px-4 py-2 rounded-lg border border-border text-sm font-medium hover:bg-secondary/50 transition-colors">
                  <Share2 className="h-4 w-4" />
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
  );

  // Main Render
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-white/70 dark:bg-slate-950/70 border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors lg:hidden"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 shadow-lg shadow-primary/20">
                <Brain className="h-4 w-4 text-white" />
              </div>
              <h1 className="font-display text-lg font-bold text-foreground hidden sm:block">
                {lang === 'sw' ? 'Kituo cha Sera cha AI' : 'AI Policy Hub'}
              </h1>
              <span className="text-[10px] font-normal bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                {lang === 'sw' ? 'Kijaribio' : 'Pilot'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* AI Chat Button */}
            <button
              onClick={() => setIsAIChatOpen(!isAIChatOpen)}
              className="relative p-2 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <MessageSquare className="h-5 w-5 text-primary" />
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </button>

            {/* Notifications */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-red-500" />
            </button>

            {/* User */}
            <div className="flex items-center gap-2 ml-2 border-l border-border pl-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-emerald-600 text-white text-sm font-bold">
                G
              </div>
              <span className="text-sm font-medium text-foreground hidden sm:block"></span>
            </div>
          </div>
        </div>
      </header>

      {/* Notifications Dropdown */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-4 top-16 z-30 w-80 bg-card rounded-xl border border-border shadow-2xl overflow-hidden"
          >
            <div className="p-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">{lang === 'sw' ? 'Arifa' : 'Notifications'}</h3>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {notifications.map((notif) => (
                <div key={notif.id} className="p-3 border-b border-border hover:bg-secondary/30 transition-colors">
                  <div className="flex items-start gap-2">
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      notif.type === 'critical' ? 'bg-red-100 text-red-600' : 
                      notif.type === 'warning' ? 'bg-amber-100 text-amber-600' : 
                      notif.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {notif.type === 'critical' ? <AlertTriangle className="h-3 w-3" /> : 
                       notif.type === 'success' ? <CheckCircle2 className="h-3 w-3" /> : 
                       <Bell className="h-3 w-3" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{notif.title}</p>
                      <p className="text-xs text-muted-foreground">{notif.message}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground">{notif.time}</span>
                        {notif.ai_generated && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                            <Sparkles className="h-2 w-2" />
                            AI
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence>
          {(sidebarOpen || !isMobile) && (
            <motion.aside
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`${isMobile ? 'fixed left-0 top-0 z-40 h-full w-64 bg-card/95 backdrop-blur-xl shadow-2xl' : 'relative w-64'} border-r border-border/50 flex-shrink-0 overflow-y-auto`}
            >
              <div className="p-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        if (isMobile) setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                          : 'text-muted-foreground hover:bg-secondary/50'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? 'text-primary-foreground' : ''}`} />
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* Sidebar Footer - AI Status */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border/50">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-gradient-to-r from-primary/5 to-emerald-500/5 border border-primary/10">
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
                    <Brain className="h-3.5 w-3.5 text-primary animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">{lang === 'sw' ? 'AI Imewashwa' : 'AI Active'}</p>
                    <p className="text-[10px] text-muted-foreground">{lang === 'sw' ? 'Uaminifu' : 'Confidence'}: 89%</p>
                  </div>
                  <ConfidenceGauge value={89} size="sm" showLabel={false} />
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === 'dashboard' && renderDashboard()}
                {activeTab === 'analytics' && renderAnalytics()}
                {activeTab === 'recommendations' && renderRecommendations()}
                {activeTab === 'briefs' && renderBriefs()}
                {activeTab === 'community' && renderCommunity()}
                {activeTab === 'training' && renderTraining()}
                {activeTab === 'stakeholders' && renderStakeholders()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* AI Chat Panel */}
      <AnimatePresence>
        {isAIChatOpen && renderAIChat()}
      </AnimatePresence>

      {/* Recommendation Detail Modal */}
      {renderRecommendationModal()}
    </div>
  );
}
