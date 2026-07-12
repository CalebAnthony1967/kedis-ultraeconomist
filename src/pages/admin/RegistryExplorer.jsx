import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '@/lib/i18n';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { ENTITY_CONFIGS, logAudit, toastSuccess, toastError, toastWarning, formatCellValue, truncate } from '@/lib/adminUtils';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Database, Search, Edit3, Trash2, Eye, EyeOff, Shield, Plus,
  Loader2, X, Save, ChevronLeft, ChevronRight, Check, AlertTriangle
} from 'lucide-react';

export default function RegistryExplorer() {
  const { lang } = useLanguage();
  const [selectedTable, setSelectedTable] = useState('indicators');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 25;

  const config = ENTITY_CONFIGS[selectedTable];

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error, count } = await supabase
        .from(selectedTable)
        .select('*', { count: 'exact' })
        .order('updated_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);
      if (error) throw error;
      setRecords(data || []);
      setTotalCount(count || 0);
    } catch (e) {
      toastError('Failed to load records', e.message);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [selectedTable, page]);

  useEffect(() => {
    setPage(0);
  }, [selectedTable]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Get display columns from first record (or config)
  const columns = records.length > 0
    ? Object.keys(records[0]).filter(k => !config.excludeColumns.includes(k))
    : [];

  const filtered = records.filter(r => {
    if (!search) return true;
    return JSON.stringify(r).toLowerCase().includes(search.toLowerCase());
  });

  // -------------------------------------------------------------------------
  // Inline Edit
  // -------------------------------------------------------------------------
  const handleEdit = async (record, field, value) => {
    const oldValue = record[field];
    // Don't save if unchanged
    if (String(oldValue ?? '') === String(value ?? '')) {
      setEditingCell(null);
      return;
    }

    // Convert value based on column type
    let parsedValue = value;
    if (config.booleanColumns?.includes(field)) {
      parsedValue = value === 'true' || value === true;
    } else if (typeof oldValue === 'number') {
      parsedValue = parseFloat(value) || 0;
    } else if (typeof oldValue === 'boolean') {
      parsedValue = value === 'true' || value === true;
    }

    try {
      const { error } = await supabase
        .from(selectedTable)
        .update({ [field]: parsedValue })
        .eq('id', record.id);
      if (error) throw error;

      setRecords(prev => prev.map(r => r.id === record.id ? { ...r, [field]: parsedValue } : r));
      await logAudit('edit', selectedTable, record.id, `Updated ${field} in ${selectedTable}`);
      toastSuccess('Record updated', `${field} saved successfully`);
    } catch (e) {
      toastError('Update failed', e.message);
    }
    setEditingCell(null);
  };

  // -------------------------------------------------------------------------
  // Delete
  // -------------------------------------------------------------------------
  const handleDelete = async (record) => {
    if (!confirm('Delete this record? This action is permanent and logged to the audit trail.')) return;
    try {
      const { error } = await supabase.from(selectedTable).delete().eq('id', record.id);
      if (error) throw error;
      setRecords(prev => prev.filter(r => r.id !== record.id));
      setTotalCount(prev => prev - 1);
      await logAudit('delete', selectedTable, record.id, `Deleted record from ${selectedTable}`);
      toastSuccess('Record deleted', 'Changes rippled across the lakehouse');
    } catch (e) {
      toastError('Delete failed', e.message);
    }
  };

  // -------------------------------------------------------------------------
  // Toggle Hidden
  // -------------------------------------------------------------------------
  const handleToggleHidden = async (record) => {
    if (!config.canHide) {
      toastWarning('Hide not available', 'This table does not support hiding records');
      return;
    }
    const newHidden = !record.is_hidden;
    try {
      const { error } = await supabase
        .from(selectedTable)
        .update({ is_hidden: newHidden })
        .eq('id', record.id);
      if (error) throw error;
      setRecords(prev => prev.map(r => r.id === record.id ? { ...r, is_hidden: newHidden } : r));
      await logAudit('edit', selectedTable, record.id, `${newHidden ? 'Hid' : 'Unhid'} record in ${selectedTable}`);
      if (newHidden) {
        toastWarning('Record hidden', 'Masked from Citizen Lab — staff can still view');
      } else {
        toastSuccess('Record visible', 'Now visible to public');
      }
    } catch (e) {
      // Column may not exist yet
      toastError('Failed to toggle visibility', e.message);
    }
  };

  // -------------------------------------------------------------------------
  // Add Record
  // -------------------------------------------------------------------------
  const handleAddRecord = async (newData) => {
    try {
      const { data, error } = await supabase
        .from(selectedTable)
        .insert(newData)
        .select()
        .single();
      if (error) throw error;
      setRecords(prev => [data, ...prev]);
      setTotalCount(prev => prev + 1);
      await logAudit('upload', selectedTable, data.id, `Created new record in ${selectedTable}`);
      toastSuccess('Record created', 'Added to the National Lakehouse');
      setShowAdd(false);
    } catch (e) {
      toastError('Create failed', e.message);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <TooltipProvider>
      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
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
          {Object.entries(ENTITY_CONFIGS).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setSelectedTable(key)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                selectedTable === key
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-card border border-border text-muted-foreground hover:bg-secondary'
              }`}
            >
              {cfg.label}
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
              onChange={e => setSearch(e.target.value)}
              placeholder={lang === 'sw' ? 'Tafuta rekodi...' : 'Search records...'}
              className="w-full rounded-lg border border-input bg-card pl-10 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {filtered.length} / {totalCount.toLocaleString()} {lang === 'sw' ? 'rekodi' : 'records'}
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
                  {filtered.map((record) => (
                    <tr key={record.id} className={`border-b border-border hover:bg-secondary/30 ${record.is_hidden ? 'opacity-40' : ''}`}>
                      {columns.map(col => {
                        const isEditing = editingCell?.id === record.id && editingCell?.field === col;
                        const isEnum = config.enumColumns?.[col];
                        const isBoolean = config.booleanColumns?.includes(col) || typeof record[col] === 'boolean';
                        return (
                          <td key={col} className="px-4 py-3 text-foreground/80 whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis">
                            {isEditing ? (
                              isEnum ? (
                                <select
                                  autoFocus
                                  value={editValue}
                                  onChange={e => setEditValue(e.target.value)}
                                  onBlur={() => handleEdit(record, col, editValue)}
                                  className="w-full rounded border border-amber-500 px-2 py-1 text-xs outline-none bg-card"
                                >
                                  <option value="">—</option>
                                  {isEnum.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                              ) : isBoolean ? (
                                <select
                                  autoFocus
                                  value={String(record[col])}
                                  onChange={e => handleEdit(record, col, e.target.value === 'true')}
                                  className="w-full rounded border border-amber-500 px-2 py-1 text-xs outline-none bg-card"
                                >
                                  <option value="true">Yes</option>
                                  <option value="false">No</option>
                                </select>
                              ) : (
                                <input
                                  autoFocus
                                  type="text"
                                  defaultValue={formatCellValue(record[col])}
                                  onChange={e => setEditValue(e.target.value)}
                                  onBlur={e => handleEdit(record, col, e.target.value)}
                                  onKeyDown={e => { if (e.key === 'Enter') handleEdit(record, col, editValue); if (e.key === 'Escape') setEditingCell(null); }}
                                  className="w-full rounded border border-amber-500 px-2 py-1 text-xs outline-none bg-card"
                                />
                              )
                            ) : (
                              <span
                                onClick={() => { setEditingCell({ id: record.id, field: col }); setEditValue(formatCellValue(record[col])); }}
                                className="cursor-pointer hover:text-amber-600"
                              >
                                {formatCellValue(record[col])}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {config.canHide && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => handleToggleHidden(record)}
                                  className={`p-1.5 rounded hover:bg-secondary ${record.is_hidden ? 'text-amber-600' : 'text-muted-foreground'}`}
                                >
                                  {record.is_hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>{record.is_hidden ? 'Unhide from public' : 'Hide from public'}</TooltipContent>
                            </Tooltip>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => handleDelete(record)}
                                className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Delete record</TooltipContent>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalCount > pageSize && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium disabled:opacity-50 hover:bg-secondary"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Prev
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium disabled:opacity-50 hover:bg-secondary"
                >
                  Next
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Privacy notice */}
        <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-center gap-3">
          <Shield className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-800">
            {lang === 'sw'
              ? 'Rekodi zilizofichwa hazionekani kwa umma. Mabadiliko yote yanarekodiwa kwenye Njia ya Ukaguzi wa Taifa na hash ya SHA-256.'
              : 'Hidden records are masked from the Citizen Lab. All changes are logged to the National Audit Trail with SHA-256 hashes.'}
          </p>
        </div>
      </div>

      {/* Add Record Dialog */}
      {showAdd && (
        <AddRecordDialog
          columns={columns}
          config={config}
          tableName={selectedTable}
          onClose={() => setShowAdd(false)}
          onSave={handleAddRecord}
        />
      )}
    </TooltipProvider>
  );
}

// ---------------------------------------------------------------------------
// Add Record Dialog
// ---------------------------------------------------------------------------
function AddRecordDialog({ columns, config, tableName, onClose, onSave }) {
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);

  const handleChange = (col, value) => {
    setFormData(prev => ({ ...prev, [col]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    // Convert types
    const processed = { ...formData };
    for (const [key, value] of Object.entries(processed)) {
      if (value === '' || value === null || value === undefined) {
        delete processed[key];
      } else if (config.booleanColumns?.includes(key)) {
        processed[key] = value === 'true' || value === true;
      } else if (!isNaN(value) && value !== '' && typeof value !== 'boolean') {
        processed[key] = parseFloat(value);
      }
    }
    await onSave(processed);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-card border border-border shadow-2xl p-6 animate-scale-in max-h-[90vh] overflow-y-auto scrollbar-thin" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-lg text-foreground">Add Record to {tableName}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            {columns.map(col => {
              const isEnum = config.enumColumns?.[col];
              const isBoolean = config.booleanColumns?.includes(col);
              return (
                <div key={col}>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    {col.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </label>
                  {isEnum ? (
                    <select
                      value={formData[col] || ''}
                      onChange={e => handleChange(col, e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="">— Select —</option>
                      {isEnum.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : isBoolean ? (
                    <select
                      value={formData[col] || 'false'}
                      onChange={e => handleChange(col, e.target.value === 'true')}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData[col] || ''}
                      onChange={e => handleChange(col, e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:shadow-lg">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Create Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}