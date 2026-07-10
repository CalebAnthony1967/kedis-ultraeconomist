import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';
import {
  Sliders, MapPin, TrendingUp, Users, GraduationCap, Heart,
  DollarSign, Send, CheckCircle2, Loader2
} from 'lucide-react';

const WARDS = [
  'Kibera, Nairobi', 'Westlands, Nairobi', 'Mavoko, Machakos', 'Naivasha, Nakuru',
  'Likoni, Mombasa', 'Nyali, Mombasa', 'Nyeri Central, Nyeri', 'Vihiga, Vihiga',
  'Bungoma South, Bungoma', 'Kisumu Central, Kisumu', 'Garissa Township, Garissa',
];

const BUDGET_LEVERS = [
  { key: 'education', label: 'Education', icon: GraduationCap, basePct: 22, min: 5, max: 40, color: 'text-red-600', bg: 'bg-red-50' },
  { key: 'health', label: 'Health', icon: Heart, basePct: 8, min: 2, max: 25, color: 'text-pink-600', bg: 'bg-pink-50' },
  { key: 'infrastructure', label: 'Infrastructure', icon: DollarSign, basePct: 18, min: 5, max: 35, color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'agriculture', label: 'Agriculture', icon: Users, basePct: 6, min: 1, max: 20, color: 'text-emerald-600', bg: 'bg-emerald-50' },
];

export default function PolicyPlayground() {
  const { lang, t } = useLanguage();
  const [ward, setWard] = useState('');
  const [levers, setLevers] = useState(Object.fromEntries(BUDGET_LEVERS.map(l => [l.key, l.basePct])));
  const [simulated, setSimulated] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const totalBudget = Object.values(levers).reduce((a, b) => a + b, 0);

  const impacts = BUDGET_LEVERS.map(lever => {
    const delta = levers[lever.key] - lever.basePct;
    const impact = delta * (lever.key === 'education' ? 0.8 : lever.key === 'health' ? 1.2 : lever.key === 'agriculture' ? 1.5 : 0.6);
    return { ...lever, delta, impact };
  });

  const handleLever = (key, value) => {
    setLevers(prev => ({ ...prev, [key]: parseFloat(value) }));
    setSimulated(true);
  };

  const handleSubmit = async () => {
    if (!ward) return;
    setSubmitting(true);
    try {
      await base44.entities.CitizenFeedback.create({
        ward_name: ward.split(',')[0],
        county: ward.split(',')[1]?.trim() || '',
        project_name: 'Policy Playground Submission',
        status_report: `Budget simulation: Education ${levers.education}%, Health ${levers.health}%, Infrastructure ${levers.infrastructure}%, Agriculture ${levers.agriculture}%`,
        project_status: 'in_progress',
        submitter_type: 'citizen',
        is_anonymous: true,
        language: lang,
      });
      setSubmitted(true);
    } catch (e) {}
    setSubmitting(false);
  };

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-foreground">{t('public.playground')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {lang === 'sw'
            ? 'Badilisha bajeti ya taifa na uone jinsi inavyoathiri kata yako.'
            : 'Adjust the national budget and see how it affects your ward.'}
        </p>
      </div>

      {/* Ward selector */}
      <div className="rounded-2xl border border-border bg-card p-5 mb-6">
        <label className="block text-sm font-semibold mb-2 flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-primary" />
          {lang === 'sw' ? 'Chagua kata yako' : 'Select your ward'}
        </label>
        <select
          value={ward}
          onChange={(e) => setWard(e.target.value)}
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">{lang === 'sw' ? 'Chagua...' : 'Choose...'}</option>
          {WARDS.map(w => <option key={w} value={w}>{w}</option>)}
        </select>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Budget sliders */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">{lang === 'sw' ? 'Vidhibiti vya Bajeti' : 'Budget Levers'}</h3>
            </div>
            <span className={`text-sm font-bold ${totalBudget > 100 ? 'text-red-600' : 'text-primary'}`}>{totalBudget}%</span>
          </div>

          <div className="space-y-5">
            {BUDGET_LEVERS.map(lever => (
              <div key={lever.key}>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium flex items-center gap-1.5">
                    <lever.icon className={`h-4 w-4 ${lever.color}`} />
                    {lever.label}
                  </label>
                  <span className="text-sm font-bold text-primary">{levers[lever.key]}%</span>
                </div>
                <input
                  type="range"
                  min={lever.min}
                  max={lever.max}
                  value={levers[lever.key]}
                  onChange={(e) => handleLever(lever.key, e.target.value)}
                  className="w-full h-2 rounded-full appearance-none bg-secondary cursor-pointer accent-primary"
                />
                <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                  <span>{lever.min}%</span>
                  <span>Base: {lever.basePct}%</span>
                  <span>{lever.max}%</span>
                </div>
              </div>
            ))}
          </div>

          {totalBudget > 100 && (
            <p className="mt-4 text-xs text-red-600 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              {lang === 'sw' ? 'Onyo: Bajeti inazidi 100%' : 'Warning: Budget exceeds 100%'}
            </p>
          )}
        </div>

        {/* Impact cards */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-3">
              {lang === 'sw' ? 'Athari kwenye Kata Yako' : 'Impact on Your Ward'}
            </h3>
            <div className="space-y-3">
              {impacts.map(impact => (
                <div key={impact.key} className="flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <impact.icon className={`h-4 w-4 ${impact.color}`} />
                    <span className="text-sm font-medium">{impact.label}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${impact.impact > 0 ? 'text-emerald-600' : impact.impact < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                      {impact.impact > 0 ? '+' : ''}{impact.impact.toFixed(1)}%
                    </span>
                    <p className="text-[10px] text-muted-foreground">
                      {lang === 'sw' ? 'athari' : 'ward impact'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Narrative */}
          {simulated && ward && (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 animate-fade-in">
              <h3 className="text-sm font-semibold mb-2">
                {lang === 'sw' ? 'Hadithi ya Data' : 'Data Story'}
              </h3>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {lang === 'sw'
                  ? `Kama bajeti ya Elimu iongezwa kutoka ${BUDGET_LEVERS[0].basePct}% hadi ${levers.education}%, tunakadiria ongezeko la ${((levers.education - BUDGET_LEVERS[0].basePct) * 0.8).toFixed(1)}% katika fursa za elimu katika ${ward.split(',')[0]}.`
                  : `If the Education budget is increased from ${BUDGET_LEVERS[0].basePct}% to ${levers.education}%, we estimate a ${((levers.education - BUDGET_LEVERS[0].basePct) * 0.8).toFixed(1)}% increase in educational opportunities in ${ward.split(',')[0]}.`}
              </p>
            </div>
          )}

          {/* Submit feedback */}
          <button
            onClick={handleSubmit}
            disabled={!ward || submitting || submitted}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50 hover:shadow-lg transition-all"
          >
            {submitted ? <CheckCircle2 className="h-4 w-4" /> : submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {submitted
              ? (lang === 'sw' ? 'Imewasilishwa!' : 'Submitted!')
              : submitting
                ? (lang === 'sw' ? 'Inawasilisha...' : 'Submitting...')
                : (lang === 'sw' ? 'Wasilisha Maoni yako' : 'Submit Your Feedback')}
          </button>
        </div>
      </div>
    </div>
  );
}