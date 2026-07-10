import React from 'react';
import { Shield, TableProperties, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function ETLDataPreview({ rows, headers, fileName }) {
  const previewRows = rows.slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Silo-Healing banner */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
          <Shield className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            Silo-Healing Engine (Forward-Fill)
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                Automatically forward-fills the first 4 columns to resolve merged-cell gaps.
                String magnitudes (e.g. "5.2M" → 5,200,000) are normalized.
              </TooltipContent>
            </Tooltip>
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Forward-fill applied to first 4 columns · String magnitudes normalized · Whitespace trimmed
          </p>
        </div>
      </div>

      {/* Preview table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <span className="text-sm font-semibold flex items-center gap-2">
            <TableProperties className="h-4 w-4 text-primary" />
            Preview — first {previewRows.length} of {rows.length} rows
          </span>
          <span className="text-xs text-muted-foreground truncate max-w-[200px]">{fileName}</span>
        </div>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-2 py-2 text-left font-semibold text-muted-foreground w-8">#</th>
                {headers.map(h => (
                  <th key={h} className="px-3 py-2 text-left font-semibold text-muted-foreground whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, ri) => (
                <tr key={ri} className="border-b border-border/50 hover:bg-secondary/30">
                  <td className="px-2 py-2 text-muted-foreground">{ri + 1}</td>
                  {headers.map(h => (
                    <td key={h} className="px-3 py-2 text-foreground/80 whitespace-nowrap max-w-[200px] truncate">
                      {String(row[h] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}