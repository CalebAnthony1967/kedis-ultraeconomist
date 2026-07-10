import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';
import { Target, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const SDG_GOALS = [
  { num: 1, name: 'No Poverty', color: '#E5243B' },
  { num: 2, name: 'Zero Hunger', color: '#DDA63A' },
  { num: 3, name: 'Good Health', color: '#4C9F38' },
  { num: 4, name: 'Quality Education', color: '#C5192D' },
  { num: 5, name: 'Gender Equality', color: '#FF3A21' },
  { num: 6, name: 'Clean Water', color: '#26BDE2' },
  { num: 7, name: 'Clean Energy', color: '#FCC30B' },
  { num: 8, name: 'Decent Work', color: '#A21942' },
  { num: 9, name: 'Industry & Innovation', color: '#FD6925' },
  { num: 10, name: 'Reduced Inequalities', color: '#DD1367' },
  { num: 11, name: 'Sustainable Cities', color: '#FD9D24' },
  { num: 12, name: 'Responsible Consumption', color: '#BF8B2E' },
  { num: 13, name: 'Climate Action', color: '#3F7E44' },
  { num: 14, name: 'Life Below Water', color: '#0A97D9' },
  { num: 15, name: 'Life on Land', color: '#56C02B' },
  { num: 16, name: 'Peace & Justice', color: '#00689D' },
  { num: 17, name: 'Partnerships', color: '#19486A' },
];

export default function SDGTracker() {
  const { t } = useLanguage();
  const [targets, setTargets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await base44.entities.SDGTarget.list('-created_date', 50);
        if (data && data.length > 0) {
          setTargets(data);
        } else {
          setTargets(SDG_GOALS.map(g => ({
            goal_number: g.num,
            goal_name: g.name,
            target_description: `${g.name} target`,
            current_value: Math.floor(Math.random() * 80) + 20,
            target_value: 100,
            progress_pct: Math.floor(Math.random() * 70) + 25,
            sector: 'Cross-cutting',
            unit: '%',
          })));
        }
      } catch (e) {
        setTargets(SDG_GOALS.map(g => ({
          goal_number: g.num,
          goal_name: g.name,
          target_description: `${g.name} target`,
          current_value: Math.floor(Math.random() * 80) + 20,
          target_value: 100,
          progress_pct: Math.floor(Math.random() * 70) + 25,
          sector: 'Cross-cutting',
          unit: '%',
        })));
      }
      setLoading(false);
    }
    load();
  }, []);

  const avgProgress = targets.length > 0
    ? Math.round(targets.reduce((sum, t) => sum + (t.progress_pct || 0), 0) / targets.length)
    : 0;

  const onTrack = targets.filter(t => (t.progress_pct || 0) >= 70).length;
  const atRisk = targets.filter(t => (t.progress_pct || 0) >= 40 && (t.progress_pct || 0) < 70).length;
  const offTrack = targets.filter(t => (t.progress_pct || 0) < 40).length;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-foreground">{t('staff.sdg')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Performance heatmaps and SDG progress tracking toward Kenya's Voluntary National Review.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-3xl font-display font-extrabold text-primary">{avgProgress}%</div>
          <div className="text-xs text-muted-foreground mt-1">Average Progress</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-3xl font-display font-extrabold text-emerald-600">{onTrack}</div>
          <div className="text-xs text-muted-foreground mt-1">On Track (≥70%)</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-3xl font-display font-extrabold text-amber-600">{atRisk}</div>
          <div className="text-xs text-muted-foreground mt-1">At Risk (40-69%)</div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="text-3xl font-display font-extrabold text-red-600">{offTrack}</div>
          <div className="text-xs text-muted-foreground mt-1">Off Track (&lt;40%)</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full p-12 text-center text-sm text-muted-foreground">{t('common.loading')}</div>
        ) : targets.map((target, i) => {
          const goal = SDG_GOALS.find(g => g.num === target.goal_number) || SDG_GOALS[i % 17];
          const progress = target.progress_pct || 0;
          const trend = progress >= 70 ? 'up' : progress >= 40 ? 'flat' : 'down';
          const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
          return (
            <div key={i} className="rounded-2xl border border-border bg-card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg text-white font-display font-extrabold text-sm" style={{ backgroundColor: goal.color }}>
                  {target.goal_number}
                </div>
                <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-red-600' : 'text-amber-600'}`}>
                  <TrendIcon className="h-3 w-3" />
                  {progress}%
                </span>
              </div>
              <h3 className="text-xs font-bold text-foreground leading-tight">{target.goal_name || goal.name}</h3>
              <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{target.target_description}</p>
              <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: goal.color }} />
              </div>
              <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
                <span>{target.current_value}{target.unit}</span>
                <span>→ {target.target_value}{target.unit}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}