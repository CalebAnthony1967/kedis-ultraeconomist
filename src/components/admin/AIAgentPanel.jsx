import React, { useState } from 'react';
import { Brain, Loader2, RefreshCw, AlertTriangle, Zap, CheckCircle2, Activity, Sparkles } from 'lucide-react';
import { analyzeConnectorHealth, detectStaleConnectors } from '@/lib/connectorAI';
import { toastSuccess, toastError, toastWarning } from '@/lib/adminUtils';

export default function AIAgentPanel({ connectors, onSyncConnector }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeConnectorHealth(connectors);
      setAnalysis(result);

      const anomalyCount = result.anomalies?.length || 0;
      const newDataCount = result.new_data_available?.length || 0;

      if (result.overall_health === 'critical') {
        toastError('Pipeline health critical', `${anomalyCount} anomalies detected`);
      } else if (result.overall_health === 'degraded') {
        toastWarning('Pipeline degraded', `${anomalyCount} anomalies need attention`);
      } else {
        toastSuccess('Pipeline healthy', `${newDataCount} connectors may have new data`);
      }
    } catch (e) {
      setError(e.message);
      toastError('AI analysis failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSync = () => {
    const stale = detectStaleConnectors(connectors);
    if (stale.length === 0) {
      toastSuccess('All connectors up to date', 'No stale connectors detected');
      return;
    }
    toastWarning(`Auto-syncing ${stale.length} stale connectors`, 'Syncing connectors with overdue data');
    stale.forEach(({ connector }) => {
      if (connector.status === 'active') {
        onSyncConnector(connector);
      }
    });
  };

  const healthBadge = {
    healthy: { color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2, label: 'Healthy' },
    degraded: { color: 'text-amber-600', bg: 'bg-amber-50', icon: AlertTriangle, label: 'Degraded' },
    critical: { color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle, label: 'Critical' },
    unknown: { color: 'text-muted-foreground', bg: 'bg-muted', icon: Activity, label: 'Not Analyzed' },
  };

  const badge = healthBadge[analysis?.overall_health || 'unknown'];
  const BadgeIcon = badge.icon;

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-primary">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-foreground">CDC AI Agent</h3>
            <p className="text-[10px] text-muted-foreground">Autonomous pipeline monitoring · Hugging Face</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${badge.color} ${badge.bg} px-2.5 py-1 rounded-full`}>
          <BadgeIcon className="h-3.5 w-3.5" />
          {badge.label}
        </span>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={runAnalysis}
          disabled={loading || connectors.length === 0}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50 transition-all hover:shadow-md"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {loading ? 'Analyzing...' : 'Run AI Analysis'}
        </button>
        <button
          onClick={handleAutoSync}
          disabled={loading}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary transition-colors"
        >
          <Zap className="h-3.5 w-3.5 text-amber-500" />
          Auto-Sync Stale
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 mb-3">
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {analysis && (
        <div className="space-y-3 animate-fade-in">
          {/* Summary */}
          {analysis.summary && (
            <div className="rounded-lg bg-card border border-border p-3">
              <p className="text-xs text-foreground/80 leading-relaxed">{analysis.summary}</p>
            </div>
          )}

          {/* Anomalies */}
          {analysis.anomalies?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                Anomalies ({analysis.anomalies.length})
              </h4>
              <div className="space-y-1.5">
                {analysis.anomalies.map((a, i) => (
                  <div key={i} className={`rounded-lg px-3 py-2 text-xs ${a.severity === 'critical' ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
                    <span className="font-semibold text-foreground">{a.connector}:</span>{' '}
                    <span className="text-muted-foreground">{a.issue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New data available */}
          {analysis.new_data_available?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-blue-500" />
                New Data Likely Available
              </h4>
              <div className="space-y-1.5">
                {analysis.new_data_available.map((d, i) => (
                  <div key={i} className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-foreground">{d.connector}</span>
                      <p className="text-[10px] text-muted-foreground">{d.reason}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${d.confidence === 'high' ? 'bg-blue-200 text-blue-800' : 'bg-blue-100 text-blue-600'}`}>
                      {d.confidence}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {analysis.recommendations?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <RefreshCw className="h-3.5 w-3.5 text-primary" />
                Recommendations
              </h4>
              <div className="space-y-1.5">
                {analysis.recommendations.map((r, i) => (
                  <div key={i} className="rounded-lg bg-secondary/50 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">{r.connector}</span>
                      <span className="text-[10px] font-bold text-primary uppercase">{r.action}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{r.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {!analysis && !loading && (
        <div className="text-center py-4">
          <p className="text-xs text-muted-foreground">
            Run AI analysis to detect anomalies, identify new data releases, and get actionable recommendations.
          </p>
        </div>
      )}
    </div>
  );
}