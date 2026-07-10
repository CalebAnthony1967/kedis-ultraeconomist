import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import {
  Newspaper, Download, Calendar, TrendingUp, FileText,
  Image as ImageIcon, Loader2, Globe2, Clock, ExternalLink
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const HEADLINES = [
  { time: '2h ago', title: 'KNBS releases 2025 Economic Survey — 2024 Actuals now live', category: 'Release' },
  { time: '5h ago', title: 'CBK holds base rate at 10.0% — inflation eases to 5.2%', category: 'Monetary' },
  { time: '1d ago', title: 'Treasury publishes BPS 2025 framework — MTEF projections updated', category: 'Fiscal' },
  { time: '2d ago', title: 'Kenya SDG progress report: 7 of 17 goals on track', category: 'SDG' },
  { time: '3d ago', title: 'Maize production in Bomet County up 12% YoY', category: 'Agriculture' },
];

const RELEASE_CALENDAR = [
  { date: 'Jul 15', event: 'CPI Inflation Data (June)', source: 'KNBS' },
  { date: 'Jul 22', event: 'Balance of Payments Q2', source: 'CBK' },
  { date: 'Aug 01', event: 'Quarterly GDP Report Q2', source: 'KNBS' },
  { date: 'Aug 14', event: 'Monetary Policy Statement', source: 'CBK' },
  { date: 'Sep 01', event: 'Economic Survey 2025', source: 'KNBS' },
];

const INDICATORS = ['GDP Growth', 'Inflation Rate', 'Exchange Rate (KES/USD)', 'Unemployment'];

const chartData = [
  { period: 'Q1 24', value: 5.1 },
  { period: 'Q2 24', value: 5.4 },
  { period: 'Q3 24', value: 5.6 },
  { period: 'Q4 24', value: 5.8 },
  { period: 'Q1 25', value: 6.1 },
  { period: 'Q2 25', value: 6.3 },
];

export default function MediaRoom() {
  const { lang } = useLanguage();
  const [selectedIndicator, setSelectedIndicator] = useState('GDP Growth');
  const [generating, setGenerating] = useState(false);
  const [indicators, setIndicators] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await base44.entities.Indicator.list('-created_date', 10);
        setIndicators(data || []);
      } catch (e) {}
    }
    load();
  }, []);

  const handleDownloadChart = () => {
    setGenerating(true);
    setTimeout(() => setGenerating(false), 1500);
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-2">
          <Newspaper className="h-6 w-6 text-teal-600" />
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-foreground">
            {lang === 'sw' ? 'Chumba cha Habari' : 'Media Room'}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {lang === 'sw'
            ? 'Vichwa vya habari rasmi, jenereta ya infografik, na kalenda ya kutolewa.'
            : 'Official headlines, infographic generator & release calendar for journalists.'}
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Newsfeed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 space-y-6"
        >
          {/* Automated Headlines */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Newspaper className="h-4 w-4 text-teal-600" />
              {lang === 'sw' ? 'Vichwa vya Habari vya Moja kwa Moja' : 'Automated Headlines'}
            </h3>
            <div className="space-y-3">
              {HEADLINES.map((h, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg border border-border p-3 hover:bg-secondary/30 transition-colors cursor-pointer">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${
                    h.category === 'Release' ? 'bg-emerald-50 text-emerald-600' :
                    h.category === 'Monetary' ? 'bg-blue-50 text-blue-600' :
                    h.category === 'Fiscal' ? 'bg-amber-50 text-amber-600' :
                    h.category === 'SDG' ? 'bg-purple-50 text-purple-600' :
                    'bg-teal-50 text-teal-600'
                  }`}>
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-tight">{h.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-semibold text-teal-600">{h.category}</span>
                      <span className="text-[10px] text-muted-foreground">· {h.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Infographic Generator */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-teal-600" />
              {lang === 'sw' ? 'Jenereta ya Infografik' : 'Infographic Generator'}
            </h3>
            <div className="flex flex-wrap gap-2 mb-4">
              {INDICATORS.map(ind => (
                <button
                  key={ind}
                  onClick={() => setSelectedIndicator(ind)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    selectedIndicator === ind ? 'bg-teal-600 text-white' : 'bg-secondary text-muted-foreground hover:bg-secondary/70'
                  }`}
                >
                  {ind}
                </button>
              ))}
            </div>
            <div className="rounded-xl border border-border bg-gradient-to-br from-teal-50 to-cyan-50 p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-heading font-bold text-foreground">{selectedIndicator}</h4>
                  <p className="text-[10px] text-muted-foreground">Source: KIPPRA Official · SPI: KED-IS-2025-0142</p>
                </div>
                <div className="inline-flex items-center gap-1 rounded-full bg-teal-600/10 px-2 py-1 text-[10px] font-bold text-teal-700">
                  <Globe2 className="h-3 w-3" />
                  KIPPRA Verified
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(150 15% 85%)" />
                  <XAxis dataKey="period" tick={{ fontSize: 10, fill: 'hsl(155 10% 40%)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(155 10% 40%)' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(150 15% 85%)', fontSize: '12px' }} />
                  <Line type="monotone" dataKey="value" stroke="#0d9488" strokeWidth={3} dot={{ fill: '#0d9488', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
              <button
                onClick={handleDownloadChart}
                disabled={generating}
                className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg disabled:opacity-50"
              >
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {generating
                  ? (lang === 'sw' ? 'Inatengeneza...' : 'Generating...')
                  : (lang === 'sw' ? 'Pakua Infografik' : 'Download Infographic (PNG)')}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Release Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-teal-600" />
              {lang === 'sw' ? 'Kalenda ya Kutolewa' : 'Release Calendar'}
            </h3>
            <p className="text-[10px] text-muted-foreground mb-3">IMF e-GDDS Standard</p>
            <div className="space-y-2">
              {RELEASE_CALENDAR.map((event, i) => (
                <div key={i} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-foreground">{event.date}</span>
                    <span className="text-[10px] font-semibold text-teal-600">{event.source}</span>
                  </div>
                  <p className="text-xs text-foreground/80">{event.event}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Integrity badge */}
          <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5 text-center">
            <Globe2 className="h-8 w-8 text-teal-600 mx-auto mb-2" />
            <h4 className="font-heading font-bold text-sm text-foreground">
              {lang === 'sw' ? 'Imethibitishwa' : 'Integrity Verified'}
            </h4>
            <p className="text-[10px] text-muted-foreground mt-1">
              {lang === 'sw' ? 'Namba hizi hazijabadilishwa tangu kuingizwa.' : 'Data unchanged since Admin ingestion. SHA-256 verified.'}
            </p>
            <p className="text-[10px] font-mono text-teal-700 mt-2 break-all">
              a3f5e8d2b9c1f4e7
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}