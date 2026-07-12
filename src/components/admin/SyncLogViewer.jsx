import React from 'react';
import { History, CheckCircle2, AlertTriangle, Clock, Loader2 } from 'lucide-react';
import { formatRelativeTime } from '@/lib/adminUtils';

const STATUS_CONFIG = {
  success: { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2, label: 'Success' },
  failed: { color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle, label: 'Failed' },
  partial: { color: 'text-amber-600', bg: 'bg-amber-50', icon: AlertTriangle, label: 'Partial' },
  pending: { color: 'text-blue-600', bg: 'bg-blue-50', icon: Loader2, label: 'In Progress' },
};

export default function SyncLogViewer({ logs, isLoading }) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <History className="h-4 w-4 text-primary" />
          Sync History
        </h3>
        <span className="text-xs text-muted-foreground">{logs.length} events</span>
      </div>

      <div className="max-h-96 overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <div className="px-4 py-8 text-center">
            <Loader2 className="h-5 w-5 text-primary animate-spin mx-auto" />
          </div>
        ) : logs.length === 0 ? (
          <div className="px-4 py-8 text-center text-xs text-muted-foreground">
            <Clock className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
            No sync events recorded yet
          </div>
        ) : (
          logs.map((log) => {
            const cfg = STATUS_CONFIG[log.status] || STATUS_CONFIG.pending;
            const StatusIcon = cfg.icon;
            return (
              <div key={log.id} className="px-4 py-3 border-b border-border/50 last:border-0 hover:bg-secondary/30">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`h-3.5 w-3.5 ${cfg.color} ${log.status === 'pending' ? 'animate-spin' : ''}`} />
                      <span className="text-xs font-semibold text-foreground truncate">{log.connector_name || 'Unknown'}</span>
                    </div>
                    {log.error_message && (
                      <p className="text-[10px] text-red-600 mt-1 line-clamp-2">{log.error_message}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground">{formatRelativeTime(log.created_at)}</span>
                      <span className="text-[10px] text-muted-foreground">·</span>
                      <span className="text-[10px] text-muted-foreground">{log.records_pulled || 0} records</span>
                      {log.duration_ms && (
                        <>
                          <span className="text-[10px] text-muted-foreground">·</span>
                          <span className="text-[10px] text-muted-foreground">{(log.duration_ms / 1000).toFixed(1)}s</span>
                        </>
                      )}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color} font-medium`}>
                        {log.triggered_by || 'manual'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}