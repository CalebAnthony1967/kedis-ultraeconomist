import React, { useState, useRef } from 'react';
import { useLanguage } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';
import {
  FileText, Sparkles, Loader2, Route, CheckCircle2, Hash,
  Calendar, Download, Edit3, Save
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';

const SECTORS = ['Agriculture', 'Education', 'Health', 'Manufacturing', 'Tourism', 'ICT', 'Finance', 'Governance'];

export default function ReportGenerator() {
  const { t } = useLanguage();
  const [sector, setSector] = useState('Agriculture');
  const [dateStart, setDateStart] = useState('2020-01-01');
  const [dateEnd, setDateEnd] = useState('2024-12-31');
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  const [routing, setRouting] = useState(false);
  const [routed, setRouted] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    setReport(null);
    setRouted(false);
    try {
      const prompt = `You are AlphaEconomist's Automated Report Generator. Draft a comprehensive ${sector} Sector Report for Kenya covering the period ${dateStart} to ${dateEnd}. 

Structure:
1. Executive Summary
2. Key Indicators (with specific verified figures — cite SPI for each)
3. Trends Analysis (with year-over-year comparisons)
4. SDG Progress (relevant goals)
5. Policy Recommendations
6. Risk Assessment

Include traceable numbers for: JSS Gender Parity, Primary GER, sector GVA growth, and employment figures. 
Cite every data point with a Sovereign Persistent Identifier in format [SPI:XXX-XXX].
Write in formal economic planning language suitable for a Principal Secretary briefing.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            citations: { type: 'array', items: { type: 'string' } },
          },
        },
      });

      setReport({
        title: response.title || `${sector} Sector Report`,
        content: response.content || '',
        citations: response.citations || [],
      });
      setEditedContent(response.content || '');
    } catch (e) {
      setReport({
        title: `${sector} Sector Report`,
        content: 'Error generating report. Please try again.',
        citations: [],
      });
    }
    setGenerating(false);
  };

  const handleSaveEdit = () => {
    setReport(prev => ({ ...prev, content: editedContent }));
    setEditing(false);
  };

  const handleRoute = async () => {
    setRouting(true);
    try {
      await base44.entities.ReportDraft.create({
        title: report.title,
        sector,
        content: report.content,
        status: 'routed',
        citations: JSON.stringify(report.citations),
        date_range_start: dateStart,
        date_range_end: dateEnd,
        routed_to: 'Principal Secretary',
      });
      setRouted(true);
    } catch (e) {}
    setRouting(false);
  };

  const handleDownload = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(report.title, 20, 25);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Sector: ${sector} | Period: ${dateStart} to ${dateEnd}`, 20, 35);
    doc.setTextColor(0);
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(report.content, 170);
    doc.text(lines, 20, 50);
    doc.save(`${report.title.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-foreground">{t('staff.reports')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">LLM-grounded sector reports with traceable SPI citations. Drafts routed to Principal Secretaries.</p>
      </div>

      {/* Config */}
      <div className="rounded-2xl border border-border bg-card p-5 mb-6">
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5">Sector</label>
            <select value={sector} onChange={(e) => setSector(e.target.value)} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary">
              {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">From</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">To</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 hover:shadow-lg transition-all"
        >
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {generating ? 'Generating Report...' : 'Generate Report'}
        </button>
      </div>

      {/* Report */}
      {report && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden animate-fade-in">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-heading font-bold text-foreground">{report.title}</h3>
            <div className="flex gap-2">
              {!editing ? (
                <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary">
                  <Edit3 className="h-3.5 w-3.5" /> Edit
                </button>
              ) : (
                <button onClick={handleSaveEdit} className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
                  <Save className="h-3.5 w-3.5" /> Save
                </button>
              )}
              <button onClick={handleDownload} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary">
                <Download className="h-3.5 w-3.5" /> PDF
              </button>
              <button onClick={handleRoute} disabled={routing || routed} className="inline-flex items-center gap-1 rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5 disabled:opacity-50">
                {routed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Route className="h-3.5 w-3.5" />}
                {routed ? 'Routed' : routing ? 'Routing...' : 'Route to PS'}
              </button>
            </div>
          </div>

          <div className="p-6">
            {editing ? (
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full min-h-[400px] rounded-lg border border-input bg-background p-4 text-sm font-mono outline-none focus:ring-2 focus:ring-primary"
              />
            ) : (
              <ReactMarkdown className="text-sm text-foreground/90 prose prose-sm max-w-none prose-headings:font-heading prose-headings:text-foreground prose-strong:text-foreground prose-li:my-0.5">
                {report.content}
              </ReactMarkdown>
            )}

            {/* Citations */}
            {report.citations.length > 0 && (
              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5" />
                  SPI Citations ({report.citations.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {report.citations.map((c, i) => (
                    <span key={i} className="inline-flex items-center gap-1 rounded-md bg-primary/5 border border-primary/10 px-2 py-0.5 text-xs font-mono text-primary">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}