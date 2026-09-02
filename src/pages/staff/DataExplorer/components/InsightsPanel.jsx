import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle,
  CheckCircle2, BarChart3, Lightbulb, MapPin, Target,
  ChevronDown, ChevronUp, Hash, Database, Sparkles
} from 'lucide-react';

export default function InsightsPanel({
  data = [],
  onGenerate = () => {},
  className = '',
  citations = [],
  confidence = 0,
  missingEntities = [],
  detectedGeography = null,
  detectedIntent = null,
}) {
  const { lang } = useLanguage();
  const [insights, setInsights] = useState([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (data && data.length > 0) {
      generateInsights(data);
    } else {
      setInsights([]);
    }
  }, [data]);

  const generateInsights = (results) => {
    setIsLoading(true);

    setTimeout(() => {
      const generated = [];

      // 1. Data Summary
      generated.push({
        id: 'summary',
        icon: <Database className="h-4 w-4 text-primary" />,
        text: `${results.length} ${lang === 'sw' ? 'viashiria' : 'indicators'} ${lang === 'sw' ? 'vimepatikana' : 'found'}`,
        severity: 'low',
        type: 'info',
      });

      // 2. Geography Context
      if (detectedGeography?.name) {
        generated.push({
          id: 'geography',
          icon: <MapPin className="h-4 w-4 text-emerald-500" />,
          text: `${lang === 'sw' ? 'Eneo' : 'Location'}: ${detectedGeography.name}`,
          severity: 'low',
          type: 'geo',
        });
      }

      // 3. Intent Context
      if (detectedIntent) {
        generated.push({
          id: 'intent',
          icon: <Target className="h-4 w-4 text-amber-500" />,
          text: `${lang === 'sw' ? 'Aina ya swali' : 'Query type'}: ${detectedIntent}`,
          severity: 'low',
          type: 'intent',
        });
      }

      // 4. Confidence
      if (confidence > 0) {
        const confidenceLabel = confidence >= 0.7 ? 'High' : confidence >= 0.4 ? 'Medium' : 'Low';
        const confidenceColor = confidence >= 0.7 ? 'text-emerald-600' : confidence >= 0.4 ? 'text-amber-600' : 'text-red-600';
        generated.push({
          id: 'confidence',
          icon: <CheckCircle2 className="h-4 w-4 text-primary" />,
          text: `${lang === 'sw' ? 'Uaminifu' : 'Confidence'}: ${confidenceLabel} (${Math.round(confidence * 100)}%)`,
          severity: confidence >= 0.7 ? 'low' : 'medium',
          type: 'confidence',
          color: confidenceColor,
        });
      }

      // 5. Missing Entities
      if (missingEntities && missingEntities.length > 0) {
        generated.push({
          id: 'missing',
          icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
          text: `${lang === 'sw' ? 'Viashiria vinavyokosekana' : 'Missing indicators'}: ${missingEntities.join(', ')}`,
          severity: 'high',
          type: 'warning',
        });
      }

      // 6. SPI Citations
      if (citations && citations.length > 0) {
        generated.push({
          id: 'citations',
          icon: <Hash className="h-4 w-4 text-primary" />,
          text: `${citations.length} SPI ${lang === 'sw' ? 'zimetajwa' : 'cited'}`,
          severity: 'low',
          type: 'citations',
          citations: citations,
        });
      }

      setInsights(generated);
      setIsLoading(false);
      onGenerate(generated);
    }, 300);
  };

  if (insights.length === 0 && !isLoading) {
    return (
      <div className={`rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-4 ${className}`}>
        <div className="text-center text-sm text-muted-foreground">
          <Lightbulb className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p>{lang === 'sw' ? 'Chagua data ili kupata uchambuzi wa AI' : 'Select data to generate AI insights'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-foreground">
            {lang === 'sw' ? 'Uchambuzi wa AI' : 'AI Insights'}
          </h3>
          {insights.length > 0 && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {insights.length}
            </span>
          )}
          {confidence > 0 && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border flex items-center gap-1
              ${confidence >= 0.7 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                confidence >= 0.4 ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                'bg-red-500/10 text-red-600 border-red-500/20'
              }`}
            >
              {Math.round(confidence * 100)}%
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {/* Body */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-1.5">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-muted-foreground mt-2">
                {lang === 'sw' ? 'Inachambua...' : 'Analyzing...'}
              </p>
            </div>
          ) : (
            insights.map((insight) => (
              <div
                key={insight.id}
                className={`flex items-start gap-3 p-2.5 rounded-lg text-xs
                  ${insight.severity === 'high' ? 'bg-red-50 border border-red-100' :
                    insight.severity === 'medium' ? 'bg-amber-50 border border-amber-100' :
                    'bg-secondary/30 border border-border/50'
                  }`}
              >
                <div className="shrink-0 mt-0.5">{insight.icon}</div>
                <div className="flex-1">
                  <span className={`text-foreground/80 ${insight.color || ''}`}>
                    {insight.text}
                  </span>
                  {insight.citations && insight.citations.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {insight.citations.slice(0, 5).map((spi, i) => (
                        <span key={i} className="text-[10px] font-mono bg-primary/5 px-1.5 py-0.5 rounded border border-primary/10 text-primary">
                          {spi}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
