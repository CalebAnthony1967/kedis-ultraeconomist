import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';
import {
  FileText, Sparkles, Loader2, Download, CheckCircle2,
  Globe2, Calendar, Layers
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';

const SDG_OPTIONS = [
  { num: 1, name: 'No Poverty' },
  { num: 2, name: 'Zero Hunger' },
  { num: 3, name: 'Good Health' },
  { num: 4, name: 'Quality Education' },
  { num: 5, name: 'Gender Equality' },
  { num: 6, name: 'Clean Water' },
  { num: 7, name: 'Clean Energy' },
  { num: 8, name: 'Decent Work' },
  { num: 9, name: 'Industry & Innovation' },
  { num: 10, name: 'Reduced Inequalities' },
  { num: 13, name: 'Climate Action' },
  { num: 17, name: 'Partnerships' },
];

export default function SDGVNRGenerator() {
  const { lang, t } = useLanguage();
  const [selectedGoals, setSelectedGoals] = useState([1, 4, 8]);
  const [yearRange, setYearRange] = useState({ start: 2015, end: 2025 });
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState(null);

  const toggleGoal = (num) => {
    setSelectedGoals(prev =>
      prev.includes(num) ? prev.filter(g => g !== num) : [...prev, num]
    );
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setReport(null);
    try {
      const goalsText = selectedGoals.map(g => `SDG ${g}: ${SDG_OPTIONS.find(s => s.num === g)?.name}`).join(', ');
      const prompt = `You are AlphaEconomist's SDG VNR (Voluntary National Review) Generator for the UN. Create a comprehensive VNR section for Kenya covering: ${goalsText}. Period: ${yearRange.start}-${yearRange.end}. 

Structure:
1. Introduction & Context
2. Progress per SDG (with specific data points and SPI citations)
3. Challenges & Gaps
4. Policy Actions Taken
5. Next Steps & Commitments

Write in formal UN reporting language. ${lang === 'sw' ? 'Write in Swahili.' : 'Write in English.'}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
          },
        },
      });
      setReport({
        title: response.title || `Kenya VNR Report — SDGs ${selectedGoals.join(', ')}`,
        content: response.content || '',
      });
    } catch (e) {
      setReport({
        title: 'VNR Generation Error',
        content: 'An error occurred. Please try again.',
      });
    }
    setGenerating(false);
  };

  const handleDownload = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(report.title, 20, 25);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Period: ${yearRange.start}-${yearRange.end} | SDGs: ${selectedGoals.join(', ')}`, 20, 35);
    doc.setTextColor(0);
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(report.content, 170);
    doc.text(lines, 20, 50);
    doc.save('Kenya_VNR_Report.pdf');
  };

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-foreground">{t('public.vnr')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Automated Voluntary National Review generator for the United Nations.</p>
      </div>

      {/* Config */}
      <div className="rounded-2xl border border-border bg-card p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Globe2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Select SDG Goals</h3>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {SDG_OPTIONS.map(goal => (
            <button
              key={goal.num}
              onClick={() => toggleGoal(goal.num)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedGoals.includes(goal.num)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:bg-secondary/70'
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold">
                {goal.num}
              </span>
              {goal.name}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {lang === 'sw' ? 'Mwaka wa Mwanzo' : 'Start Year'}
            </label>
            <input
              type="number"
              min={2000}
              max={2025}
              value={yearRange.start}
              onChange={(e) => setYearRange(prev => ({ ...prev, start: parseInt(e.target.value) }))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {lang === 'sw' ? 'Mwaka wa Mwisho' : 'End Year'}
            </label>
            <input
              type="number"
              min={2000}
              max={2030}
              value={yearRange.end}
              onChange={(e) => setYearRange(prev => ({ ...prev, end: parseInt(e.target.value) }))}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating || selectedGoals.length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 hover:shadow-lg transition-all"
        >
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {generating ? (lang === 'sw' ? 'Inatengeneza...' : 'Generating...') : (lang === 'sw' ? 'Tengeneza VNR' : 'Generate VNR')}
        </button>
      </div>

      {/* Report */}
      {report && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden animate-fade-in">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="font-heading font-bold text-sm">{report.title}</h3>
            </div>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary"
            >
              <Download className="h-3.5 w-3.5" />
              PDF
            </button>
          </div>
          <div className="p-6">
            <ReactMarkdown className="text-sm text-foreground/90 prose prose-sm max-w-none prose-headings:font-heading prose-headings:text-foreground prose-strong:text-foreground prose-li:my-0.5">
              {report.content}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}