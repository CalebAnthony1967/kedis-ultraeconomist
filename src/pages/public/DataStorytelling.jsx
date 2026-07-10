import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';
import {
  BookOpen, TrendingUp, DollarSign, Users, Globe2, Sparkles,
  ArrowRight, Loader2, Download
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import ReactMarkdown from 'react-markdown';

const STORIES = [
  {
    id: 'gdp-growth',
    title_en: 'Kenya\'s GDP Growth Story',
    title_sw: 'Hadithi ya Ukuaji wa GDP wa Kenya',
    icon: TrendingUp,
    color: 'emerald',
    desc_en: 'How Kenya\'s economy grew from $6B in 1963 to $112B today.',
    desc_sw: 'Jinsi uchumi wa Kenya ulivyoukua kutoka $6B mwaka 1963 hadi $112B leo.',
  },
  {
    id: 'poverty-reduction',
    title_en: 'The Poverty Reduction Journey',
    title_sw: 'Safari ya Kupunguza Umasikini',
    icon: Users,
    color: 'blue',
    desc_en: 'Tracking 60 years of poverty alleviation efforts across counties.',
    desc_sw: 'Kufuatilia juhudi za miaka 60 za kupunguza umasikini kwa kaunti.',
  },
  {
    id: 'sdg-progress',
    title_en: 'SDG Progress Dashboard',
    title_sw: 'Dashibodi ya Maendeleo ya SDG',
    icon: Globe2,
    color: 'amber',
    desc_en: 'Where Kenya stands on the 17 Sustainable Development Goals.',
    desc_sw: 'Kenya iko wapi katika Malengo ya Maendeleo ya kudumu 17.',
  },
];

const colorMap = {
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', chart: 'hsl(149 56% 40%)' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', chart: 'hsl(217 91% 60%)' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', chart: 'hsl(32 90% 50%)' },
};

const generateStoryData = (id) => {
  const data = [];
  let val = id === 'gdp-growth' ? 6 : id === 'poverty-reduction' ? 65 : 20;
  for (let year = 1963; year <= 2024; year += 5) {
    if (id === 'gdp-growth') val *= 1.08;
    else if (id === 'poverty-reduction') val *= 0.96;
    else val += Math.random() * 3;
    data.push({ year, value: Math.round(val * 10) / 10 });
  }
  return data;
};

export default function DataStorytelling() {
  const { lang, t } = useLanguage();
  const [activeStory, setActiveStory] = useState(null);
  const [narrative, setNarrative] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleStory = async (story) => {
    setActiveStory(story);
    setNarrative(null);
    setLoading(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `You are AlphaEconomist's Data Storytelling engine. Write a brief, engaging visual narrative about "${lang === 'sw' ? story.title_sw : story.title_en}" for ordinary Kenyan citizens. Use simple language, explain economic concepts plainly. Write in ${lang === 'sw' ? 'Swahili' : 'English'}. Include 3 key takeaways. Keep it under 300 words.`,
      });
      setNarrative(response);
    } catch (e) {
      setNarrative(lang === 'sw'
        ? 'Samahani, hitilafu imetokea. Tafadhali jaribu tena.'
        : 'Sorry, an error occurred. Please try again.');
    }
    setLoading(false);
  };

  if (activeStory) {
    const data = generateStoryData(activeStory.id);
    const colors = colorMap[activeStory.color];
    return (
      <div className="p-4 lg:p-8 max-w-5xl mx-auto">
        <button
          onClick={() => { setActiveStory(null); setNarrative(null); }}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowRight className="h-4 w-4 rotate-180" />
          {lang === 'sw' ? 'Rudi kwenye Hadithi' : 'Back to Stories'}
        </button>

        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className={`p-6 ${colors.bg}`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-card`}>
                <activeStory.icon className={`h-6 w-6 ${colors.text}`} />
              </div>
              <div>
                <h1 className="font-display text-xl lg:text-2xl font-extrabold text-foreground">
                  {lang === 'sw' ? activeStory.title_sw : activeStory.title_en}
                </h1>
                <p className="text-sm text-muted-foreground">{lang === 'sw' ? activeStory.desc_sw : activeStory.desc_en}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Chart */}
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="storyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={colors.chart} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={colors.chart} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(150 15% 90%)" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: 'hsl(155 10% 40%)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(155 10% 40%)' }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(150 15% 90%)', fontSize: '12px' }} />
                <Area type="monotone" dataKey="value" stroke={colors.chart} strokeWidth={2.5} fill="url(#storyGrad)" />
              </AreaChart>
            </ResponsiveContainer>

            {/* Narrative */}
            {loading ? (
              <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                {lang === 'sw' ? 'Inaandika hadithi...' : 'Generating narrative...'}
              </div>
            ) : narrative ? (
              <div className="mt-6 prose prose-sm max-w-none">
                <ReactMarkdown className="text-sm text-foreground/90 prose-p:my-2 prose-li:my-0.5">
                  {narrative}
                </ReactMarkdown>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-foreground">{t('public.stories')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {lang === 'sw' ? 'Hadithi za data zinazoelezea viashiria vya kiuchumi kwa lugha rahisi.' : 'Visual narratives explaining economic indicators in simple terms.'}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {STORIES.map(story => {
          const colors = colorMap[story.color];
          return (
            <button
              key={story.id}
              onClick={() => handleStory(story)}
              className="group text-left rounded-2xl border border-border bg-card overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1"
            >
              <div className={`h-32 ${colors.bg} flex items-center justify-center`}>
                <story.icon className={`h-12 w-12 ${colors.text}`} />
              </div>
              <div className="p-5">
                <div className="inline-flex items-center gap-1 text-xs font-semibold text-primary mb-2">
                  <Sparkles className="h-3 w-3" />
                  {lang === 'sw' ? 'Hadithi ya Data' : 'Data Story'}
                </div>
                <h3 className="font-heading font-bold text-foreground">
                  {lang === 'sw' ? story.title_sw : story.title_en}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {lang === 'sw' ? story.desc_sw : story.desc_en}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                  {lang === 'sw' ? 'Soma' : 'Read'}
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}