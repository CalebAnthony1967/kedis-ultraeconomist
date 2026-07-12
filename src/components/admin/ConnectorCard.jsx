import React from 'react';
import {
  Pause, Play, RefreshCw, AlertTriangle, CheckCircle2,
  Clock, Settings, Trash2, Radio, Zap, Activity
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatRelativeTime } from '@/lib/adminUtils';

const STATUS_CONFIG = {
  active:   { color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-500', icon: CheckCircle2, label: 'Active' },
  paused:   { color: 'text-slate-500',   bg: 'bg-slate-100',  dot: 'bg-slate-400',  icon: Pause, label: 'Paused' },
  error:    { color: 'text-red-600',     bg: 'bg-red-50',     dot: 'bg-red-500',     icon: AlertTriangle, label: 'Error' },
  syncing:  { color: 'text-blue-600',    bg: 'bg-blue-50',    dot: 'bg-blue-500',    icon: RefreshCw, label: 'Syncing' },
};

export default function ConnectorCard({ conn, onSync, onToggle, onEdit, onDelete, isSyncing }) {
  const cfg = STATUS_CONFIG[conn.status] || STATUS_CONFIG.active;
  const StatusIcon = cfg.icon;
  const healthLabel = conn.health_score >= 90 ? 'Excellent' : conn.health_score >= 70 ? 'Good' : conn.health_score >= 50 ? 'Degraded' : 'Critical';
  const healthColor = conn.health_score >= 90 ? 'text-emerald-600' : conn.health_score >= 70 ? 'text-blue-600' : conn.health_score >= 50 ? 'text-amber-600' : 'text-red-600';

  return (
    <div className="rounded-2xl border border-border bg-card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${cfg.bg} shrink-0`}>
            <StatusIcon className={`h-4 w-4 ${cfg.color} ${conn.status === 'syncing' ? 'animate-spin' : ''}`} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">{conn.name}</h3>
            <p className="text-xs text-muted-foreground">{conn.type.replace(/_/g, ' ')}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${cfg.color} ${cfg.bg} px-2 py-1 rounded-full shrink-0`}>
          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} ${conn.status === 'active' || conn.status === 'syncing' ? 'animate-pulse' : ''}`} />
          {cfg.label}
        </span>
      </div>

      <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{conn.description || conn.source_url || 'No description'}</p>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <div className="text-lg font-display font-bold text-foreground">{(conn.records_synced || 0).toLocaleString()}</div>
          <div className="text-[10px] text-muted-foreground">Records</div>
        </div>
        <div>
          <div className={`text-lg font-display font-bold ${healthColor}`}>{Math.round(conn.health_score || 0)}%</div>
          <div className="text-[10px] text-muted-foreground">{healthLabel}</div>
        </div>
        <div>
          <div className="flex items-center gap-1 text-xs font-medium text-foreground">
            {conn.auto_sync ? <Zap className="h-3 w-3 text-amber-500" /> : <Clock className="h-3 w-3 text-muted-foreground" />}
            {conn.auto_sync ? 'Auto' : 'Manual'}
          </div>
          <div className="text-[10px] text-muted-foreground">{conn.poll_interval_minutes || 60}m interval</div>
        </div>
      </div>

      {conn.last_error && conn.status === 'error' && (
        <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2">
          <p className="text-[10px] text-red-700 line-clamp-2">{conn.last_error}</p>
        </div>
      )}

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
        <Clock className="h-3.5 w-3.5" />
        {formatRelativeTime(conn.last_sync)}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onSync(conn)}
          disabled={conn.status === 'syncing' || conn.status === 'paused'}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          Sync Now
        </button>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onToggle(conn)}
              className="inline-flex items-center justify-center rounded-lg border border-border bg-card p-2 text-foreground hover:bg-secondary transition-colors"
            >
              {conn.status === 'active' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </button>
          </TooltipTrigger>
          <TooltipContent>{conn.status === 'active' ? 'Pause connector' : 'Resume connector'}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onEdit(conn)}
              className="inline-flex items-center justify-center rounded-lg border border-border bg-card p-2 text-foreground hover:bg-secondary transition-colors"
            >
              <Settings className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Configure</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onDelete(conn)}
              className="inline-flex items-center justify-center rounded-lg border border-border bg-card p-2 text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Delete connector</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}