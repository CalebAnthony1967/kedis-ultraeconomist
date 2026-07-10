import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Brain, Hash, TrendingUp, FileText, Route, Database,
  ChevronDown, ChevronUp, Copy, Check
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';

export default function CopilotMessage({ message, onRouteToPS }) {
  const isUser = message.role === 'user';
  const [showSources, setShowSources] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  if (isUser) {
    return (
      <div className="flex justify-end animate-slide-up">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-sm text-primary-foreground">
          {message.content}
        </div>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast({ title: 'Copied to clipboard' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex justify-start animate-slide-up">
      <div className="max-w-[85%] w-full">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-primary">
            <Brain className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-xs font-semibold text-foreground">AlphaEconomist</span>
          {message.context_count > 0 && (
            <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full flex items-center gap-1">
              <Database className="h-2.5 w-2.5" />
              {message.context_count} sources
            </span>
          )}
        </div>
        <div className="rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3">
          <ReactMarkdown className="text-sm text-foreground/90 prose prose-sm max-w-none prose-p:my-1 prose-li:my-0 prose-strong:text-foreground prose-headings:font-heading">
            {message.content}
          </ReactMarkdown>

          {/* Probability score */}
          {message.probability_score !== undefined && message.probability_score !== null && (
            <div className="mt-3 rounded-lg bg-secondary p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  Probability of Achievement
                </span>
                <span className={`text-sm font-bold ${message.probability_score >= 70 ? 'text-emerald-600' : message.probability_score >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                  {message.probability_score}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-background overflow-hidden">
                <div
                  className={`h-full rounded-full ${message.probability_score >= 70 ? 'bg-emerald-500' : message.probability_score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${message.probability_score}%` }}
                />
              </div>
            </div>
          )}

          {/* SPI Citations */}
          {message.spi_citations && message.spi_citations.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {message.spi_citations.map((spi, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-md bg-primary/5 border border-primary/10 px-2 py-0.5 text-xs font-mono text-primary">
                  <Hash className="h-3 w-3" />
                  {spi}
                </span>
              ))}
            </div>
          )}

          {/* Retrieved sources (expandable) */}
          {message.retrieved_indicators && message.retrieved_indicators.length > 0 && (
            <div className="mt-3">
              <button
                onClick={() => setShowSources(!showSources)}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
              >
                {showSources ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                Retrieved data sources ({message.retrieved_indicators.length})
              </button>
              {showSources && (
                <div className="mt-2 rounded-lg border border-border max-h-48 overflow-y-auto scrollbar-thin">
                  {message.retrieved_indicators.map((ind, i) => (
                    <div key={i} className="px-3 py-1.5 border-b border-border/50 last:border-0 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground truncate">{ind.name}</span>
                        {ind.spi && <span className="font-mono text-primary text-[10px] shrink-0 ml-2">{ind.spi.substring(0, 20)}</span>}
                      </div>
                      <span className="text-muted-foreground">
                        {ind.year} · {ind.value} {ind.unit} · {ind.source_mcda}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="mt-2 flex gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={handleCopy} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </TooltipTrigger>
            <TooltipContent>Copy response to clipboard</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => onRouteToPS?.(message)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                <Route className="h-3.5 w-3.5" />
                Route to PS
              </button>
            </TooltipTrigger>
            <TooltipContent>Route this insight to the Principal Secretary</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}