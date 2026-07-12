import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { supabaseAuth } from '@/lib/supabaseAuth';
import { toastSuccess, toastError } from '@/lib/adminUtils';

const CONNECTOR_TYPES = [
  { value: 'KNBS_SDMX', label: 'KNBS SDMX API' },
  { value: 'CBK_Bulletin', label: 'CBK Bulletin' },
  { value: 'Treasury_BPS', label: 'Treasury BPS' },
  { value: 'SurveyCTO', label: 'SurveyCTO' },
  { value: 'KOBO_Toolbox', label: 'KOBO Toolbox' },
  { value: 'Satellite_NightLights', label: 'Satellite Night Lights' },
  { value: 'Mobile_Money', label: 'Mobile Money' },
];

export default function ConnectorFormDialog({ connector, onClose, onSaved }) {
  const isEdit = !!connector;
  const [form, setForm] = useState({
    name: connector?.name || '',
    type: connector?.type || 'KNBS_SDMX',
    source_url: connector?.source_url || '',
    description: connector?.description || '',
    poll_interval_minutes: connector?.poll_interval_minutes || 60,
    auto_sync: connector?.auto_sync || false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.source_url.trim()) {
      toastError('Validation error', 'Name and source URL are required');
      return;
    }

    setSaving(true);
    try {
      const user = await supabaseAuth.me();
      const payload = {
        ...form,
        poll_interval_minutes: parseInt(form.poll_interval_minutes, 10) || 60,
        health_score: connector?.health_score ?? 100,
        status: connector?.status || 'active',
      };

      if (isEdit) {
        const { error } = await supabase
          .from('data_connectors')
          .update(payload)
          .eq('id', connector.id);
        if (error) throw error;
        toastSuccess('Connector updated', `${form.name} configuration saved`);
      } else {
        const { error } = await supabase
          .from('data_connectors')
          .insert({ ...payload, created_by: user?.id });
        if (error) throw error;
        toastSuccess('Connector created', `${form.name} is now live`);
      }
      onSaved();
    } catch (e) {
      toastError('Failed to save connector', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl p-6 animate-scale-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-bold text-lg text-foreground">
            {isEdit ? 'Configure Connector' : 'New Data Connector'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Connector Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. KNBS Leading Economic Indicators"
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Connector Type *</label>
            <select
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
            >
              {CONNECTOR_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Source URL *</label>
            <input
              type="url"
              value={form.source_url}
              onChange={e => setForm({ ...form, source_url: e.target.value })}
              placeholder="https://api.knbs.or.ke/sdmx/..."
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="What data does this connector pull?"
              rows={2}
              className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Poll Interval (min)</label>
              <input
                type="number"
                value={form.poll_interval_minutes}
                onChange={e => setForm({ ...form, poll_interval_minutes: e.target.value })}
                min="5" max="1440"
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">Auto-Sync</label>
              <button
                type="button"
                onClick={() => setForm({ ...form, auto_sync: !form.auto_sync })}
                className={`w-full rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors
                  ${form.auto_sync ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-border bg-background text-muted-foreground'}`}
              >
                {form.auto_sync ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50 transition-all hover:shadow-lg"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}