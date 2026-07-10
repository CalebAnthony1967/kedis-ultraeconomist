import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, Hash, Database, Activity, ChevronDown, ChevronUp, UploadCloud } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function ETLIngestionResult({ result, onReset }) {
  const [showErrors, setShowErrors] = useState(false);
  const hasErrors = result.errors > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className={`rounded-2xl border p-6 ${hasErrors ? 'border-amber-500/30 bg-amber-500/5' : 'border-primary/20 bg-primary/5'}`}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${hasErrors ? 'bg-amber-500/10' : 'bg-primary/10'}`}>
            {hasErrors ? <AlertTriangle className="h-5 w-5 text-amber-600" /> : <CheckCircle2 className="h-5 w-5 text-primary" />}
          </div>
          <div>
            <h3 className="font-heading font-bold text-foreground">
              {hasErrors ? 'Ingestion Complete — Anomalies Detected' : 'Ingestion Successful — SPI Assigned'}
            </h3>
            <p className="text-sm text-muted-foreground">
              Data committed to Sovereign Data Pool · {result.inserted} records ingested
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-lg bg-card border border-border p-4">
            <div className="text-2xl font-display font-extrabold text-primary">{result.inserted.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">Records Ingested</div>
          </div>
          <div className="rounded-lg bg-card border border-border p-4">
            <div className="text-2xl font-display font-extrabold text-amber-600">{result.errors}</div>
            <div className="text-xs text-muted-foreground mt-1">Flagged to Anomaly Engine</div>
          </div>
          <div className="rounded-lg bg-card border border-border p-4">
            <div className="text-2xl font-display font-extrabold text-primary">{result.fairScore}</div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              FAIR Score
              <Tooltip>
                <TooltipTrigger asChild>
                  <Activity className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  Findable, Accessible, Interoperable, Reusable — based on SPI assignment, metadata completeness, and source attribution.
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          <div className="rounded-lg bg-card border border-border p-4">
            <div className="flex items-center gap-1.5">
              <Hash className="h-4 w-4 text-primary" />
              <span className="text-xs font-mono text-foreground/80 truncate">{result.sha256?.substring(0, 12)}…</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">SHA-256 Audit Hash</div>
          </div>
        </div>

        {result.spi && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-card border border-border px-4 py-2">
            <Database className="h-4 w-4 text-primary" />
            <span className="text-xs font-mono text-foreground/80">Job SPI: {result.spi}</span>
          </div>
        )}
      </div>

      {/* Error details */}
      {hasErrors && result.errorDetails?.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <button
            onClick={() => setShowErrors(!showErrors)}
            className="w-full px-4 py-3 flex items-center justify-between text-sm font-semibold hover:bg-secondary/30"
          >
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Validation Errors ({result.errors} rows flagged)
            </span>
            {showErrors ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showErrors && (
            <div className="border-t border-border max-h-64 overflow-y-auto scrollbar-thin">
              {result.errorDetails.map((err, i) => (
                <div key={i} className="px-4 py-2 border-b border-border/50 text-xs">
                  <span className="font-semibold text-amber-700">Row {err.row}:</span>{' '}
                  <span className="text-muted-foreground">{err.errors.join('; ')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <button onClick={onReset} className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:bg-secondary">
        <UploadCloud className="h-4 w-4" />
        Upload Another File
      </button>
    </div>
  );
}