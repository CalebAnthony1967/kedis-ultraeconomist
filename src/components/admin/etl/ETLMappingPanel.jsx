import React from 'react';
import { TableProperties, ArrowRight, Sparkles, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { GLOBAL_SCHEMA_FIELDS } from '@/lib/etlUtils';

export default function ETLMappingPanel({ headers, mapping, onMappingChange, onAutoMap }) {
  const mappedCount = Object.values(mapping).filter(v => v).length;
  const requiredFields = GLOBAL_SCHEMA_FIELDS.filter(f => f.required);
  const mappedRequired = requiredFields.filter(f => Object.values(mapping).includes(f.key));
  const allRequiredMapped = mappedRequired.length === requiredFields.length;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <TableProperties className="h-4 w-4 text-primary" />
          Global Schema Mapping
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              Map each source column to a target field in the sovereign indicators table.
              Unmapped columns are skipped during ingestion.
            </TooltipContent>
          </Tooltip>
        </h3>
        <button
          onClick={onAutoMap}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Auto-Map ({mappedCount}/{headers.length})
        </button>
      </div>

      {/* Required fields status */}
      <div className={`mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium
        ${allRequiredMapped ? 'bg-emerald-500/10 text-emerald-700' : 'bg-amber-500/10 text-amber-700'}`}>
        {allRequiredMapped ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
        {allRequiredMapped
          ? `All ${requiredFields.length} required fields mapped`
          : `${mappedRequired.length}/${requiredFields.length} required fields mapped — ingestion will fail without them`}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {headers.map((source) => {
          const targetField = GLOBAL_SCHEMA_FIELDS.find(f => f.key === mapping[source]);
          const isRequired = targetField?.required;
          return (
            <div key={source} className="flex items-center gap-2">
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-medium text-muted-foreground truncate" title={source}>{source}</span>
                {targetField && (
                  <span className={`text-[10px] ${isRequired ? 'text-amber-600 font-semibold' : 'text-muted-foreground'}`}>
                    {isRequired ? 'Required' : 'Optional'}
                  </span>
                )}
              </div>
              <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
              <select
                value={mapping[source] || ''}
                onChange={(e) => onMappingChange(source, e.target.value)}
                className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary min-w-0"
              >
                <option value="">— Skip —</option>
                {GLOBAL_SCHEMA_FIELDS.map(f => (
                  <option key={f.key} value={f.key}>
                    {f.label}{f.required ? ' *' : ''}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}