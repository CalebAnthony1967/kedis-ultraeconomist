import React from 'react';
import { History, RefreshCw, Database, CheckCircle2, AlertTriangle, Clock, Loader2 } from 'lucide-react';
import { formatRelativeTime } from '@/lib/etlUtils';

const STATUS_CONFIG = {
  ingested: { label: 'Ingested', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-500/10' },
  failed: { label: 'Failed', icon: AlertTriangle, color: 'text-destructive bg-destructive/10' },
  anomaly: { label: 'Anomaly', icon: AlertTriangle, color: 'text-amber-600 bg-amber-500/10' },
  pending: { label: 'Pending', icon: Clock, color: 'text-muted-foreground bg-muted' },
  validating: { label: 'Validating', icon: Loader2, color: 'text-blue-600 bg-blue-500/10' },
  transforming: { label: 'Transforming', icon: Loader2, color: 'text-blue-600 bg-blue-500/10' },
};

export default function ETLJobHistory({ jobs, onRefresh, isLoading }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          Recent Ingestion Jobs
        </h3>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          <Database className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
          No ingestion jobs yet
        </div>
      ) : (
        <div className="divide-y divide-border max-h-96 overflow-y-auto scrollbar-thin">
          {jobs.map((job) => {
            const status = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
            const StatusIcon = status.icon;
            return (
              <div key={job.id} className="px-4 py-3 hover:bg-secondary/30">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{job.file_name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {job.source_mcda} · {job.records_ingested || 0} records
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{formatRelativeTime(job.created_at)}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${status.color} shrink-0`}>
                    <StatusIcon className="h-3 w-3" />
                    {status.label}
                  </span>
                </div>
                {job.fair_score > 0 && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${job.fair_score}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground">FAIR {job.fair_score}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}