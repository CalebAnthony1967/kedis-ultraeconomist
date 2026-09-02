import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, AlertTriangle, 
  CheckCircle2, BarChart3, Lightbulb, 
  ChevronDown, ChevronUp 
} from 'lucide-react';

export default function InsightsPanel({ data, onGenerate, className = '' }) {
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
    
    // Simulate AI processing
    setTimeout(() => {
      const generated = [];
      
      // 1. Check for trends
      const values = results.map(r => r.value).filter(v => v !== null && v !== undefined);
      if (values.length > 1) {
        const first = values[0];
        const last = values[values.length - 1];
        const change = ((last - first) / (first || 1)) * 100;
        if (Math.abs(change) > 1) {
          generated.push({
            id: 'trend',
            icon: change > 0 ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />,
            text: `${change > 0 ? 'Increasing' : 'Decreasing'} trend detected: ${Math.abs(change).toFixed(1)}% change`,
            severity: Math.abs(change) > 10 ? 'high' : 'medium',
          });
        }
      }

      // 2. Check for anomalies
      if (values.length > 0) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const max = Math.max(...values);
        const min = Math.min(...values);
        const range = max - min;
        
        if (range / (mean || 1) > 0.3) {
          generated.push({
            id: 'anomaly',
            icon: <AlertTriangle className="h-4 w-4 text-amber-500" />,
            text: `Significant variance detected: range of ${range.toFixed(2)} from min to max`,
            severity: 'medium',
          });
        }
      }

      // 3. Check for positive indicators
      const growing = results.filter(r => r.value && r.value > 0);
      if (growing.length > 0) {
        generated.push({
          id: 'positive',
          icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
          text: `${growing.length} indicators show positive values`,
          severity: 'low',
        });
      }

      // 4. Data completeness
      if (results.length > 5) {
        const years = new Set(results.map(r => r.year));
        generated.push({
          id: 'coverage',
          icon: <BarChart3 className="h-4 w-4 text-primary" />,
          text: `${years.size} years of data available (${results.length} records)`,
          severity: 'low',
        });
      }

      // 5. Top performer
      if (results.length > 1) {
        const sorted = [...results].sort((a, b) => (b.value || 0) - (a.value || 0));
        const top = sorted[0];
        generated.push({
          id: 'top',
          icon: <Lightbulb className="h-4 w-4 text-amber-500" />,
          text: `Highest value in ${top.year}: ${top.value?.toLocaleString() || 'N/A'} ${top.unit || ''}`,
          severity: 'low',
        });
      }

      setInsights(generated);
      setIsLoading(false);
      onGenerate?.(generated);
    }, 500);
  };

  if (insights.length === 0 && !isLoading) {
    return (
      <div className={`rounded-xl border border-border bg-card p-4 ${className}`}>
        <div className="text-center text-sm text-muted-foreground">
          <Lightbulb className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p>Select data to generate AI insights</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-border bg-card overflow-hidden ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-foreground">AI Insights</h3>
          {insights.length > 0 && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {insights.length}
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
        <div className="px-4 pb-4 space-y-2">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-muted-foreground mt-2">Generating insights...</p>
            </div>
          ) : (
            insights.map((insight) => (
              <div
                key={insight.id}
                className={`flex items-start gap-3 p-3 rounded-lg text-xs
                  ${insight.severity === 'high' ? 'bg-red-50 border border-red-100' :
                    insight.severity === 'medium' ? 'bg-amber-50 border border-amber-100' :
                    'bg-secondary/30 border border-border/50'
                  }`}
              >
                <div className="shrink-0 mt-0.5">{insight.icon}</div>
                <span className="text-foreground/80">{insight.text}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
