import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import {
  Brain, Search, Hash, Database, FileText, Tag,
  Loader2, CheckCircle2, AlertCircle, Filter, BookOpen
} from 'lucide-react';

export default function KnowledgeVault() {
  const { lang } = useLanguage();
  const [indicators, setIndicators] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pillarFilter, setPillarFilter] = useState('all');

  useEffect(() => {
    async function load() {
      try {
        const [inds, jbs] = await Promise.all([
          base44.entities.Indicator.list('-created_date', 50),
          base44.entities.DataIngestionJob.list('-created_date', 20),
        ]);
        setIndicators(inds || []);
        setJobs(jbs || []);
      } catch (e) {}
      setLoading(false);
    }
    load();
  }, []);

  const pillars = ['all', 'Economic', 'Social', 'Governance', 'Environmental', 'Political'];

  const filtered = indicators.filter(ind => {
    const matchSearch = !search || ind.name?.toLowerCase().includes(search.toLowerCase()) || ind.spi?.toLowerCase().includes(search.toLowerCase());
    const matchPillar = pillarFilter === 'all' || ind.pillar === pillarFilter;
    return matchSearch && matchPillar;
  });

  const spiAssigned = indicators.filter(i => i.spi).length;
  const verified = indicators.filter(i => i.is_verified).length;
  const fairScore = indicators.length > 0 ? Math.round((spiAssigned / indicators.length) * 100) : 0;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-foreground">
            {lang === 'sw' ? 'Hazina ya Maarifa' : 'Knowledge Vault'}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {lang === 'sw'
            ? 'Msimamizi wa FAIR — hakikisha kila dataset ina SPI na imeainishwa kwa usahihi.'
            : 'The FAIR Librarian — ensure every dataset has an SPI and is correctly categorized for retrieval.'}
        </p>
      </motion.div>

      {/* FAIR Scorecard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: lang === 'sw' ? 'Alama ya FAIR' : 'FAIR Score', value: `${fairScore}%`, icon: CheckCircle2, color: 'text-emerald-600' },
          { label: lang === 'sw' ? 'SPI Zilizotolewa' : 'SPI Assigned', value: `${spiAssigned}/${indicators.length}`, icon: Hash, color: 'text-primary' },
          { label: lang === 'sw' ? 'Zilizothibitishwa' : 'Verified', value: verified, icon: CheckCircle2, color: 'text-blue-600' },
          { label: lang === 'sw' ? 'Ingestion Jobs' : 'Ingestion Jobs', value: jobs.length, icon: Database, color: 'text-amber-600' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="rounded-2xl border border-border bg-card p-5">
            <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
            <div className="font-display text-2xl font-extrabold text-foreground">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={lang === 'sw' ? 'Tafuta kwa jina au SPI...' : 'Search by name or SPI...'} className="w-full rounded-lg border border-input bg-card pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {pillars.map(p => (
            <button key={p} onClick={() => setPillarFilter(p)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${pillarFilter === p ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-secondary/70'}`}>
              {p === 'all' ? (lang === 'sw' ? 'Wote' : 'All') : p}
            </button>
          ))}
        </div>
      </div>

      {/* Metadata Registry */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" /></div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">SPI</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">{lang === 'sw' ? 'Jina' : 'Indicator'}</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">{lang === 'sw' ? 'Nguzo' : 'Pillar'}</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">{lang === 'sw' ? 'Sekta' : 'Sector'}</th>
                  <th className="text-left px-4 py-3 font-semibold text-muted-foreground">{lang === 'sw' ? 'Chanzo' : 'Source'}</th>
                  <th className="text-center px-4 py-3 font-semibold text-muted-foreground">FAIR</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 20).map((ind, i) => (
                  <tr key={ind.id || i} className="border-b border-border hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      {ind.spi ? (
                        <span className="font-mono text-xs text-primary">{ind.spi}</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600"><AlertCircle className="h-3 w-3" /> Missing</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{ind.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{ind.pillar}</td>
                    <td className="px-4 py-3 text-muted-foreground">{ind.sector}</td>
                    <td className="px-4 py-3 text-muted-foreground">{ind.source_mcda}</td>
                    <td className="px-4 py-3 text-center">
                      {ind.spi && ind.is_verified ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 mx-auto" />
                      ) : ind.spi ? (
                        <span className="text-xs text-amber-600">Partial</span>
                      ) : (
                        <span className="text-xs text-red-600">Low</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}