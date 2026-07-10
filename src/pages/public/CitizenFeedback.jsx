import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';
import {
  MessageSquare, MapPin, Send, CheckCircle2, Loader2,
  Building2, AlertCircle
} from 'lucide-react';

const PROJECT_STATUSES = [
  { key: 'not_started', label_en: 'Not Started', label_sw: 'Haijaanza', color: 'bg-slate-100 text-slate-600' },
  { key: 'in_progress', label_en: 'In Progress', label_sw: 'Inaendelea', color: 'bg-blue-50 text-blue-600' },
  { key: 'completed', label_en: 'Completed', label_sw: 'Imekamilika', color: 'bg-emerald-50 text-emerald-600' },
  { key: 'stalled', label_en: 'Stalled', label_sw: 'Imesimama', color: 'bg-amber-50 text-amber-600' },
  { key: 'abandoned', label_en: 'Abandoned', label_sw: 'Imeachwa', color: 'bg-red-50 text-red-600' },
];

const COUNTIES = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Kiambu', 'Machakos', 'Nyeri', 'Kakamega', 'Bungoma', 'Garissa', 'Turkana', 'Marsabit'];

export default function CitizenFeedback() {
  const { lang, t } = useLanguage();
  const [form, setForm] = useState({
    ward_name: '',
    county: '',
    project_name: '',
    status_report: '',
    project_status: 'in_progress',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.ward_name || !form.county || !form.project_name || !form.status_report) {
      setError(lang === 'sw' ? 'Tafadhali jaza sehemu zote zinazohitajika.' : 'Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await base44.entities.CitizenFeedback.create({
        ...form,
        submitter_type: 'citizen',
        is_anonymous: true,
        language: lang,
      });
      setSubmitted(true);
      setForm({ ward_name: '', county: '', project_name: '', status_report: '', project_status: 'in_progress' });
    } catch (e) {
      setError(lang === 'sw' ? 'Hitilafu imetokea. Jaribu tena.' : 'An error occurred. Please try again.');
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="p-4 lg:p-8 max-w-md mx-auto">
        <div className="mt-12 rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="font-display text-xl font-bold text-foreground">
            {lang === 'sw' ? 'Asante kwa Maoni yako!' : 'Thank you for your feedback!'}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {lang === 'sw'
              ? 'Maoni yako yamehifadhiwa kwa usalama na yatachunguzwa na maafisa wa mipango.'
              : 'Your feedback has been securely recorded and will be reviewed by planning officers.'}
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:shadow-lg"
          >
            {lang === 'sw' ? 'Wasilisha tena' : 'Submit another'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-foreground">{t('public.feedback')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {lang === 'sw'
            ? 'Ripoti hali ya miradi katika kata yako. Uwasilishaji wa siri umehifadhiwa.'
            : 'Report the status of projects in your ward. Anonymous submissions are protected by RLS.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5">{lang === 'sw' ? 'Jina la Kata' : 'Ward Name'} *</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={form.ward_name}
                onChange={(e) => setForm(prev => ({ ...prev, ward_name: e.target.value }))}
                placeholder={lang === 'sw' ? 'mf. Kibera' : 'e.g. Kibera'}
                className="w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">{lang === 'sw' ? 'Kaunti' : 'County'} *</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select
                value={form.county}
                onChange={(e) => setForm(prev => ({ ...prev, county: e.target.value }))}
                className="w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">{lang === 'sw' ? 'Chagua...' : 'Select...'}</option>
                {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5">{lang === 'sw' ? 'Jina la Mradi' : 'Project Name'} *</label>
          <input
            type="text"
            value={form.project_name}
            onChange={(e) => setForm(prev => ({ ...prev, project_name: e.target.value }))}
            placeholder={lang === 'sw' ? 'mf. Ujenzi wa Shule ya Msingi' : 'e.g. Primary School Construction'}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">{lang === 'sw' ? 'Hali ya Mradi' : 'Project Status'}</label>
          <div className="flex flex-wrap gap-2">
            {PROJECT_STATUSES.map(s => (
              <button
                key={s.key}
                type="button"
                onClick={() => setForm(prev => ({ ...prev, project_status: s.key }))}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  form.project_status === s.key ? `${s.color} ring-2 ring-primary` : 'bg-secondary text-muted-foreground hover:bg-secondary/70'
                }`}
              >
                {lang === 'sw' ? s.label_sw : s.label_en}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5">{lang === 'sw' ? 'Ripoti ya Hali' : 'Status Report'} *</label>
          <textarea
            value={form.status_report}
            onChange={(e) => setForm(prev => ({ ...prev, status_report: e.target.value }))}
            rows={4}
            placeholder={lang === 'sw' ? 'Eleza hali ya mradi...' : 'Describe the project status...'}
            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        )}

        <div className="rounded-lg bg-secondary/50 px-4 py-2.5 text-xs text-muted-foreground flex items-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5" />
          {lang === 'sw'
            ? 'Uwasilishaji wa siri — hakuna taarifa ya kibinafsi itakusanywa.'
            : 'Anonymous submission — no personal information is collected.'}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50 hover:shadow-lg transition-all"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {submitting
            ? (lang === 'sw' ? 'Inawasilisha...' : 'Submitting...')
            : (lang === 'sw' ? 'Wasilisha' : 'Submit Feedback')}
        </button>
      </form>
    </div>
  );
}