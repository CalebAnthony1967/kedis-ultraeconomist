import React from 'react';
import { X, Calendar, MapPin, Database, TrendingUp, FileText } from 'lucide-react';
import ChartView from './ChartView';

export default function IndicatorDetail({ 
  indicator, 
  onClose, 
  onDownload,
  isOpen 
}) {
  if (!isOpen || !indicator) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-background rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border bg-card">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-display font-bold text-foreground">
              {indicator.name}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              {indicator.indicator_id && (
                <span className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  {indicator.indicator_id}
                </span>
              )}
              {indicator.source_mcda && (
                <span className="flex items-center gap-1">
                  <Database className="h-3.5 w-3.5" />
                  {indicator.source_mcda}
                </span>
              )}
              {indicator.county_name && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {indicator.county_name}
                </span>
              )}
              {indicator.year && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {indicator.year}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="rounded-lg bg-secondary/30 p-4">
              <div className="text-xs text-muted-foreground">Value</div>
              <div className="text-lg font-bold text-foreground">
                {indicator.value?.toLocaleString() || 'N/A'}
              </div>
            </div>
            <div className="rounded-lg bg-secondary/30 p-4">
              <div className="text-xs text-muted-foreground">Unit</div>
              <div className="text-lg font-bold text-foreground">
                {indicator.unit || 'N/A'}
              </div>
            </div>
            <div className="rounded-lg bg-secondary/30 p-4">
              <div className="text-xs text-muted-foreground">Pillar</div>
              <div className="text-lg font-bold text-foreground">
                {indicator.pillar || 'N/A'}
              </div>
            </div>
            <div className="rounded-lg bg-secondary/30 p-4">
              <div className="text-xs text-muted-foreground">Entity Level</div>
              <div className="text-lg font-bold text-foreground">
                {indicator.entity_level || 'National'}
              </div>
            </div>
          </div>

          {/* Chart */}
          <ChartView 
            selectedIndicatorId={indicator.id}
            onExport={onDownload}
          />

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => onDownload(indicator)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Download Data
            </button>
            <button
              onClick={() => window.open(`/staff/explorer?indicator=${indicator.id}`, '_blank')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors"
            >
              Open in Explorer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
