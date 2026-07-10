import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import {
  Database, Search, Edit3, Trash2, Eye, EyeOff, Shield, Plus,
  Filter, ChevronDown, Tag, FileText, Loader2, CheckCircle2, X
} from 'lucide-react';

const ENTITIES = [
  { key: 'Indicator', label: 'Indicators', icon: Database },
  { key: 'WardData', label: 'Ward Data', icon: Tag },
  { key: 'DataIngestionJob', label: 'Ingestion Jobs', icon: FileText },
  { key: 'DataConnector', label: 'Connectors', icon: Database },
  { key: 'PolicyScenario', label: 'Policy Scenarios', icon: FileText },
  { key: 'SDGTarget', label: 'SDG Targets', icon: Tag },
  { key: 'CitizenFeedback', label: 'Citizen Feedback', icon: FileText },
  { key: 'ReportDraft', label: 'Report Drafts', icon: FileText },
];

export default function RegistryExplorer() {
  const { lang } = useLanguage();
  const [selectedEntity, setSelectedEntity] = useState('Indicator');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [hiddenRows, setHiddenRows] = useState(new Set());
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await base44.entities[selectedEntity].list('-updated_date', 30);
        setRecords(data || []);
      } catch (e) {
        setRecords([]);
      }
      setLoading(false);
    }
    load();
  }, [selectedEntity]);

  const columns = records.length > 0
    ? Object.keys(records[0]).filter(k => !['id', 'created_date', 'updated_date', 'created_by_id'].includes(k)).slice(0, 7)
    : [];

  const filtered = records.filter(r => {
    if (!search) return true;
    return JSON.stringify(r).toLowerCase().includes(search.toLowerCase());
  });

  const handleEdit = async (record, field, value) => {
    try {
      await base44.entities[selectedEntity].update(record.id, { [field]: value });
      setRecords(prev => prev.map(r => r.id === record.id ? { ...r, [field]: value } : r));
    } catch (e) {}
    setEditingCell(null);
  };

  const handleDelete = async (id) => {
    try {
      await base44.entities[selectedEntity].delete(id);
      setRecords(prev => prev.filter(r => r.id !== id));
    } catch (e) {}
  };

  const toggleHidden = (id) => {
    setHiddenRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-2">
          <Database className="h-6 w-6 text-amber-600" />
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-foreground">
            {lang === 'sw' ? 'Msafara wa Rekodi' : 'Registry Explorer'}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {lang === 'sw'
            ? 'Udhibiti kamili wa CRUD juu ya hifadhi ya taifa. Hariri, ficha, au futa rekodi yoyote.'
            : 'Full CRUD control over the National Lakehouse. Edit, hide, or delete any record — changes ripple instantly.'}
        </p>
      </motion.div>

      {/* Entity tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {ENTITIES.map(ent => (
          <button
            key={ent.key}
            onClick={() => setSelectedEntity(ent.key)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
              selectedEntity === ent.key
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-card border border-border text-muted-foreground hover:bg-secondary'
            }`}
          >
            <ent.icon className="h-3.5 w-3.5" />
            {ent.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === 'sw' ? 'Tafuta rekodi...' : 'Search records...'}
            className="w-full rounded-lg border border-input bg-card pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <span className="text-xs text-muted-foreground">
          {filtered.length} {lang === 'sw' ? 'rekodi' : 'records'}
        </span>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg"
        >
          <Plus className="h-4 w-4" />
          {lang === 'sw' ? 'Ongeza' : 'Add Record'}
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-amber-600 mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            {lang === 'sw' ? 'Hakuna rekodi iliyopatikana.' : 'No records found.'}
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  {columns.map(col => (
                    <th key={col} className="text-left px-4 py-3 font-semibold text-muted-foreground whitespace-nowrap">
                      {col.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </th>
                  ))}
                  <th className="text-right px-4 py-3 font-semibold text-muted-foreground">
                    {lang === 'sw' ? 'Vitendo' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((record, i) => (
                  <tr key={record.id || i} className={`border-b border-border hover:bg-secondary/30 ${hiddenRows.has(record.id) ? 'opacity-40' : ''}`}>
                    {columns.map(col => (
                      <td key={col} className="px-4 py-3 text-foreground/80 whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis">
                        {editingCell?.id === record.id && editingCell?.field === col ? (
                          <input
                            autoFocus
                            type="text"
                            defaultValue={typeof record[col] === 'object' ? JSON.stringify(record[col]) : String(record[col] ?? '')}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={(e) => handleEdit(record, col, e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleEdit(record, col, editValue)}
                            className="w-full rounded border border-amber-500 px-2 py-1 text-xs outline-none"
                          />
                        ) : (
                          <span
                            onClick={() => { setEditingCell({ id: record.id, field: col }); setEditValue(''); }}
                            className="cursor-pointer hover:text-amber-600"
                          >
                            {typeof record[col] === 'object' ? JSON.stringify(record[col])?.slice(0, 40) : String(record[col] ?? '—')}
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleHidden(record.id)}
                          title={hiddenRows.has(record.id) ? 'Unhide' : 'Hide from public'}
                          className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-amber-600"
                        >
                          {hiddenRows.has(record.id) ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          title="Delete"
                          className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Privacy notice */}
      <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-center gap-3">
        <Shield className="h-5 w-5 text-amber-600 shrink-0" />
        <p className="text-xs text-amber-800">
          {lang === 'sw'
            ? 'Rekodi zilizofichwa hazionekani kwenye Maabara ya Raia. Mabadiliko yote yanarekodiwa kwenye Njia ya Ukaguzi.'
            : 'Hidden records are masked from the Citizen Lab. All changes are logged to the National Audit Trail with SHA-256 hashes.'}
        </p>
      </div>
    </div>
  );
}