import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import {
  BarChart3, GitCompare, Cpu, Network, TrendingUp, Globe2,
  ArrowRight, Play, Layers, Activity
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const MODELS = [
  { key: 'KTMM', name: 'KIPPRA Treasury Macro-Model', desc: 'Macro-fiscal forecasting & MTEF alignment', icon: TrendingUp, color: 'emerald' },
  { key: 'CGE', name: 'Computable General Equilibrium', desc: 'Industry-level shock simulation', icon: Network, color: 'blue' },
  { key: 'KFIA', name: 'Kenya Fiscal Incidence Analysis', desc: 'Taxpayer impact & distributional analysis', icon: BarChart3, color: 'amber' },
  { key: 'SD', name: 'Hybrid Systems Dynamics', desc: 'Inter-sectoral dependency modeling', icon: Activity, color: 'purple' },
  { key: 'FF', name: 'Foresight Futures Engine', desc: 'Long-term visioning (2063)', icon: Globe2, color: 'teal' },
];

const colorMap = {
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  blue: 'bg-blue-50 text-blue-600 border-blue-200',
  amber: 'bg-amber-50 text-amber-600 border-amber-200',
  purple: 'bg-purple-50 text-purple-600 border-purple-200',
  teal: 'bg-teal-50 text-teal-600 border-teal-200',
};

const barColor = {
  emerald: 'hsl(149 56% 40%)',
  blue: 'hsl(217 91% 60%)',
  amber: 'hsl(32 90% 50%)',
  purple: 'hsl(280 55% 55%)',
  teal: 'hsl(173 58% 45%)',
};

export default function IEMH() {
  const { t } = useLanguage();
  const [selectedModels, setSelectedModels] = useState(['KTMM', 'CGE']);
  const [scenario, setScenario] = useState('baseline');
  const [results, setResults] = useState(null);
  const [running, setRunning] = useState(false);

  const toggleModel = (key) => {
    setSelectedModels(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleRun = () => {
    setRunning(true);
    setResults(null);
    setTimeout(() => {
      const data = selectedModels.map(key => {
        const model = MODELS.find(m => m.key === key);
        return {
          name: model.key,
          gdpImpact: +(Math.random() * 8 - 2).toFixed(1),
          fiscalImpact: +(Math.random() * 5 - 1).toFixed(1),
          employmentImpact: +(Math.random() * 4 - 0.5).toFixed(1),
          color: barColor[model.color],
        };
      });
      setResults(data);
      setRunning(false);
    }, 2500);
  };

  const scenarios = [
    { key: 'baseline', label: 'Baseline (MTEF)' },
    { key: 'shock_oil', label: 'Oil Price Shock (+30%)' },
    { key: 'drought', label: 'Severe Drought' },
    { key: 'stimulus', label: 'Fiscal Stimulus (+KES 100B)' },
  ];

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-foreground">{t('staff.iemh')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Institutional Model Orchestrator — execute and compare KTMM, CGE, KFIA & Systems Dynamics outputs.</p>
      </div>

      {/* Model selector */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {MODELS.map(model => {
          const isSelected = selectedModels.includes(model.key);
          return (
            <button
              key={model.key}
              onClick={() => toggleModel(model.key)}
              className={`text-left rounded-2xl border-2 p-5 transition-all ${
                isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/30'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${colorMap[model.color]}`}>
                  <model.icon className="h-5 w-5" />
                </div>
                {isSelected && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                    <Layers className="h-3.5 w-3.5" />
                    Selected
                  </span>
                )}
              </div>
              <h3 className="font-heading font-bold text-sm text-foreground">{model.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{model.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Scenario */}
      <div className="rounded-2xl border border-border bg-card p-5 mb-6">
        <h3 className="text-sm font-semibold mb-3">Scenario</h3>
        <div className="flex flex-wrap gap-2">
          {scenarios.map(s => (
            <button
              key={s.key}
              onClick={() => setScenario(s.key)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                scenario === s.key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/70'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleRun}
          disabled={running || selectedModels.length === 0}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 hover:shadow-lg transition-all"
        >
          {running ? <Cpu className="h-4 w-4 animate-pulse" /> : <Play className="h-4 w-4" />}
          {running ? 'Running Models...' : `Run ${selectedModels.length} Model(s)`}
        </button>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-6 animate-fade-in">
          {/* Comparison chart */}
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <GitCompare className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">Comparative Model Outputs — {scenarios.find(s => s.key === scenario)?.label}</h3>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={results}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(150 15% 90%)" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'hsl(155 10% 40%)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(155 10% 40%)' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(150 15% 90%)', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="gdpImpact" name="GDP Impact (%)" fill="hsl(149 56% 40%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="fiscalImpact" name="Fiscal Impact (%)" fill="hsl(32 90% 50%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="employmentImpact" name="Employment Impact (%)" fill="hsl(217 91% 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* KPH Bridge */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <div className="flex items-center gap-2 mb-2">
              <ArrowRight className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">KPH Synergy Bridge</h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Model outputs synced bidirectionally to the KIPPRA Policy Hub (KPH). Results are now available for Policy Engagement, Research Dissemination, and KIPPRA Studio integration. The Strategic Capability Link has notified the Research Department and Interdisciplinary Committees (KER, KWS).
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-card border border-border px-3 py-1.5 text-xs font-medium text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Synced to KPH
            </div>
          </div>
        </div>
      )}
    </div>
  );
}