import React, { useState, useMemo } from 'react';
import { useLanguage } from '@/lib/i18n';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronLeft,
  ChevronRight,
  Calendar,
  MapPin,
  Database,
} from 'lucide-react';

export default function TableView({
  data = [],
  onRowClick = () => {},
  className = '',
}) {
  const { lang } = useLanguage();
  const [scrollLeft, setScrollLeft] = useState(0);
  const [hoveredRow, setHoveredRow] = useState(null);

  // Extract all unique years from data
  const allYears = useMemo(() => {
    const years = new Set();
    for (const item of data) {
      if (item.values && item.values.length > 0) {
        item.values.forEach(v => years.add(v.year));
      } else if (item.year) {
        years.add(item.year);
      }
    }
    return Array.from(years).sort((a, b) => a - b);
  }, [data]);

  // Get value for a specific indicator and year
  const getValueForYear = (indicator, year) => {
    if (indicator.values) {
      const match = indicator.values.find(v => v.year === year);
      return match ? match.value : null;
    }
    if (indicator.year === year) return indicator.value;
    return null;
  };

  // Get trend for a specific indicator
  const getTrend = (indicator) => {
    if (indicator.values && indicator.values.length > 1) {
      const first = indicator.values[0]?.value;
      const last = indicator.values[indicator.values.length - 1]?.value;
      if (first && last) {
        const change = ((last - first) / (first || 1)) * 100;
        return { change, direction: change > 1 ? 'up' : change < -1 ? 'down' : 'stable' };
      }
    }
    return null;
  };

  // Format value
  const formatValue = (val) => {
    if (val === null || val === undefined) return '—';
    if (typeof val === 'number') {
      return val.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
    return val;
  };

  // Get cell colour based on value
  const getCellColour = (value) => {
    if (value === null || value === undefined) return 'text-muted-foreground';
    if (typeof value === 'number') {
      if (value > 0) return 'text-emerald-600';
      if (value < 0) return 'text-red-600';
    }
    return 'text-foreground';
  };

  // Scroll handling
  const scrollTable = (direction) => {
    const container = document.getElementById('year-scroll-container');
    if (container) {
      const scrollAmount = 300;
      const newScroll = container.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      container.scrollTo({ left: newScroll, behavior: 'smooth' });
      setScrollLeft(newScroll);
    }
  };

  if (data.length === 0) {
    return (
      <div className={`rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm p-8 text-center ${className}`}>
        <p className="text-sm text-muted-foreground">
          {lang === 'sw' ? 'Hakuna data ya kuonyesha' : 'No data to display'}
        </p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden shadow-sm ${className}`}>
      {/* Scroll Controls */}
      {allYears.length > 5 && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-secondary/20">
          <button
            onClick={() => scrollTable('left')}
            className="p-1 rounded-lg hover:bg-secondary/50 transition-colors disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <span className="text-xs text-muted-foreground">
            {allYears.length} {lang === 'sw' ? 'miaka' : 'years'} · {data.length} {lang === 'sw' ? 'viashiria' : 'indicators'}
          </span>
          <button
            onClick={() => scrollTable('right')}
            className="p-1 rounded-lg hover:bg-secondary/50 transition-colors disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      )}

      <div className="overflow-x-auto scrollbar-thin" id="year-scroll-container">
        <table className="w-full text-sm">
          <thead className="bg-secondary/30 border-b border-border/50 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground text-xs uppercase tracking-wider sticky left-0 bg-secondary/30 backdrop-blur-sm min-w-[200px] max-w-[250px]">
                {lang === 'sw' ? 'Kiashiria' : 'Indicator'}
              </th>
              <th className="px-3 py-3 text-center font-semibold text-muted-foreground text-xs uppercase tracking-wider min-w-[80px]">
                {lang === 'sw' ? 'Eneo' : 'Area'}
              </th>
              <th className="px-3 py-3 text-center font-semibold text-muted-foreground text-xs uppercase tracking-wider min-w-[60px]">
                {lang === 'sw' ? 'Kitengo' : 'Unit'}
              </th>
              {allYears.map((year) => (
                <th
                  key={year}
                  className="px-3 py-3 text-center font-semibold text-muted-foreground text-xs uppercase tracking-wider min-w-[80px]"
                >
                  {year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((indicator, index) => {
              const trend = getTrend(indicator);
              const entityLevel = indicator.entity_level || 'National';
              const entityBadge = entityLevel === 'National' 
                ? 'National' 
                : entityLevel;

              return (
                <tr
                  key={indicator.id || index}
                  className={`border-b border-border/30 hover:bg-secondary/20 transition-colors cursor-pointer
                    ${hoveredRow === index ? 'bg-secondary/10' : ''}
                  `}
                  onMouseEnter={() => setHoveredRow(index)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => onRowClick(indicator)}
                >
                  {/* Indicator Name */}
                  <td className="px-4 py-3 font-medium text-foreground sticky left-0 bg-card/90 backdrop-blur-sm border-r border-border/30">
                    <div className="flex items-center gap-2">
                      <span className="line-clamp-2">{indicator.name}</span>
                      {trend && (
                        <span className="shrink-0">
                          {trend.direction === 'up' && <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
                          {trend.direction === 'down' && <TrendingDown className="h-3.5 w-3.5 text-red-500" />}
                          {trend.direction === 'stable' && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground">
                      <span className="px-1.5 py-0.5 rounded bg-secondary/50">
                        {entityBadge}
                      </span>
                      {indicator.source_mcda && (
                        <span className="truncate max-w-[100px]">{indicator.source_mcda}</span>
                      )}
                    </div>
                  </td>

                  {/* Area */}
                  <td className="px-3 py-3 text-center text-xs text-muted-foreground">
                    {indicator.county_name || (
                      <span className="flex items-center justify-center gap-1">
                        <Database className="h-3 w-3" />
                        National
                      </span>
                    )}
                  </td>

                  {/* Unit */}
                  <td className="px-3 py-3 text-center text-xs text-muted-foreground">
                    {indicator.unit || '—'}
                  </td>

                  {/* Year Values */}
                  {allYears.map((year) => {
                    const value = getValueForYear(indicator, year);
                    return (
                      <td
                        key={year}
                        className={`px-3 py-3 text-center text-xs font-medium ${getCellColour(value)}`}
                      >
                        {value !== null && value !== undefined
                          ? formatValue(value)
                          : '—'
                        }
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
