import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import {
  Database, Download, Search, FileText, Code2, Hash,
  Loader2, CheckCircle2, Table, Filter
} from 'lucide-react';

const DATASETS = [
  { name: 'GDP & Macroeconomic Indicators (1963-2025)', records: 8400, format: 'CSV/JSON/SDMX', source: 'KNBS, CBK, Treasury' },
  { name: 'Ward-Level SAE Estimates (1,450 wards)', records: 1450, format: 'CSV/JSON', source: 'KIPPRA SAE Engine' },
  { name: 'SDG Performance Tracker', records: 169, format: 'CSV/JSON', source: 'KIPPRA / UN' },
  { name: 'County Fiscal Data (47 counties)', records: 2350, format: 'CSV/JSON', source: 'Treasury / CoG' },
  { name: 'Satellite Covariates (EVI, Temp)', records: 5600, format: 'GeoJSON', source: 'Google Earth Engine' },
  { name: 'Policy Repository (PPR)', records: 420, format: 'JSON', source: 'KIPPRA' },
];

export default function ResearchWorkspace() {
  const { lang } = useLanguage();
  const [search, setSearch] = useState('');
  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await base44.entities.Indicator.list('-created_date', 20);
        setIndicators(data || []);
      } catch (e) {}
      setLoading(false);
    }
    load();
  }, []);

  const filteredDatasets = DATASETS.filter(d =>
    !search || d.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDownload = (dataset, format) => {
    setDownloading(dataset.name + format);
    setTimeout(() => setDownloading(null), 2000);
  };

  const apiExample = `# Python Example
import requests

response = requests.get(
    "https://api.kedis.go.ke/v1/indicators",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
    params={"sector": "agriculture", "year": 2024}
)

data = response.json()
# Returns FAIR-compliant records with SPI citations`;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-2">
          <Database className="h-6 w-6 text-teal-600" />
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-foreground">
            {lang === 'sw' ? 'Nafasi ya Utafiti' : 'Research Workspace'}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {lang === 'sw'
            ? 'Maktaba kamili ya data iliyosafishwa kutoka kaunti 47 na wizara 22.'
            : 'Full, cleaned, and pooled dataset from all 47 counties and 22 ministries. FAIR-compliant with SPI metadata.'}
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Master Data Library */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2"
        >
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Table className="h-4 w-4 text-teal-600" />
                {lang === 'sw' ? 'Maktaba ya Data' : 'Master Data Library'}
              </h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={lang === 'sw' ? 'Tafuta...' : 'Search datasets...'}
                  className="rounded-lg border border-input bg-background pl-9 pr-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="space-y-3">
              {filteredDatasets.map((dataset, i) => (
                <div key={i} className="rounded-lg border border-border p-4 hover:border-teal-300 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-foreground">{dataset.name}</h4>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Database className="h-3 w-3" />{dataset.records.toLocaleString()} records</span>
                        <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{dataset.format}</span>
                        <span className="flex items-center gap-1"><Hash className="h-3 w-3" />{dataset.source}</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {['CSV', 'JSON'].map(fmt => (
                        <button
                          key={fmt}
                          onClick={() => handleDownload(dataset, fmt)}
                          disabled={downloading === dataset.name + fmt}
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[10px] font-semibold hover:bg-teal-50 hover:border-teal-300 hover:text-teal-600 disabled:opacity-50"
                        >
                          {downloading === dataset.name + fmt
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <Download className="h-3 w-3" />}
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Metadata Registry */}
          <div className="mt-6 rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Hash className="h-4 w-4 text-teal-600" />
              {lang === 'sw' ? 'Usajili wa Metadata' : 'Metadata Registry (SPI)'}
            </h3>
            {loading ? (
              <div className="text-center py-6"><Loader2 className="h-5 w-5 animate-spin text-teal-600 mx-auto" /></div>
            ) : (
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 font-semibold text-muted-foreground">SPI</th>
                      <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Indicator</th>
                      <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Sector</th>
                      <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Year</th>
                      <th className="text-left py-2 px-2 font-semibold text-muted-foreground">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {indicators.slice(0, 10).map((ind, i) => (
                      <tr key={ind.id || i} className="border-b border-border hover:bg-secondary/30">
                        <td className="py-2 px-2 font-mono text-teal-600">{ind.spi || `KED-IS-${2025}-${String(i + 1).padStart(4, '0')}`}</td>
                        <td className="py-2 px-2 text-foreground/80">{ind.name}</td>
                        <td className="py-2 px-2 text-muted-foreground">{ind.sector}</td>
                        <td className="py-2 px-2 text-muted-foreground">{ind.year}</td>
                        <td className="py-2 px-2 text-muted-foreground">{ind.source_mcda}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>

        {/* M2M API Access */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Code2 className="h-4 w-4 text-teal-600" />
              {lang === 'sw' ? 'API ya Mashine' : 'Machine-to-Machine API'}
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              {lang === 'sw' ? 'Mafunzo ya API kwa waendelezaji.' : 'Developer API instructions for automated data access.'}
            </p>
            <pre className="rounded-lg bg-secondary p-3 text-[10px] font-mono text-foreground/80 overflow-x-auto scrollbar-thin whitespace-pre-wrap">
              {apiExample}
            </pre>
            <button className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-xs font-semibold text-white hover:shadow-lg">
              <Download className="h-3.5 w-3.5" />
              {lang === 'sw' ? 'Pata API Key' : 'Request API Key'}
            </button>
          </div>

          {/* FAIR Badge */}
          <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5 text-center">
            <CheckCircle2 className="h-8 w-8 text-teal-600 mx-auto mb-2" />
            <h4 className="font-heading font-bold text-sm text-foreground">FAIR Certified</h4>
            <p className="text-[10px] text-muted-foreground mt-1">
              Findable · Accessible · Interoperable · Reusable
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {['Findable', 'Accessible', 'Interoperable', 'Reusable'].map(f => (
                <div key={f} className="rounded-lg bg-card border border-border px-2 py-1.5 text-[10px] font-semibold text-teal-600">
                  ✓ {f}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}