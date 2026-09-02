import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  Download,
  Eye,
  Hash,
  TrendingUp,
  TrendingDown,
  Minus,
  Database,
  Star,
  StarOff,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

export default function DataCard({
  indicator,
  onView = () => {},
  onDownload = () => {},
  onFavourite = () => {},
  isFavourite = false,
  className = '',
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const {
    id,
    name,
    indicator_id,
    pillar,
    county_code,
    county_name,
    year,
    value,
    unit,
    source_mcda,
    entity_level,
    subdomain_name,
    domain_name,
    years = [],
    values = [],
    year_range,
  } = indicator;

  // Determine if we have time-series data
  const hasTimeSeries = values && values.length > 1;
  const chartData = hasTimeSeries ? values : (year ? [{ year, value }] : []);

  // Determine trend
  const getTrend = () => {
    if (values && values.length > 1) {
      const first = values[0]?.value;
      const last = values[values.length - 1]?.value;
      if (first && last) {
        const change = ((last - first) / (first || 1)) * 100;
        return { change, direction: change > 1 ? 'up' : change < -1 ? 'down' : 'stable' };
      }
    }
    return null;
  };

  const trend = getTrend();

  // Get color for pillar
  const getPillarColor = (pillar) => {
    const colors = {
      Economic: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      Social: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      Governance: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      Environmental: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
      Political: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    };
    return colors[pillar] || 'bg-secondary text-muted-foreground';
  };

  // Get entity level badge
  const getEntityLevelBadge = (level) => {
    if (!level || level === 'National') return null;
    const configs = {
      County: { bg: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20', label: 'County' },
      'Sub-County': { bg: 'bg-amber-500/10 text-amber-600 border border-amber-500/20', label: 'Sub-County' },
      Ward: { bg: 'bg-purple-500/10 text-purple-600 border border-purple-500/20', label: 'Ward' },
    };
    const config = configs[level];
    if (!config) return null;
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${config.bg}`}>
        {config.label}
      </span>
    );
  };

  // Format value
  const formattedValue = value !== undefined && value !== null
    ? typeof value === 'number'
      ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
      : value
    : 'N/A';

  // Trend icon
  const TrendIcon = () => {
    if (!trend) return <Minus className="h-4 w-4 text-muted-foreground" />;
    if (trend.direction === 'up') return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    if (trend.direction === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  // Custom tooltip for mini chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border bg-card px-2 py-1 text-xs shadow-lg">
          <span className="font-medium text-foreground">{payload[0].payload.year}</span>
          <span className="ml-2 text-primary font-bold">
            {payload[0].value?.toLocaleString() || 'N/A'}
          </span>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`
        rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm p-4
        transition-all duration-200 hover:shadow-xl hover:-translate-y-1
        ${isHovered ? 'border-primary/30 shadow-primary/5' : ''}
        ${className}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getPillarColor(pillar)}`}>
            {pillar || 'General'}
          </span>
          {getEntityLevelBadge(entity_level)}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onFavourite?.(indicator)}
            className="p-1 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            {isFavourite ? (
              <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            ) : (
              <StarOff className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          <button
            onClick={() => onView(indicator)}
            className="p-1 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="mt-2">
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors">
          {name}
        </h3>
      </div>

      {/* Latest Value & Trend */}
      <div className="mt-2 flex items-end justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-display font-extrabold text-foreground">
            {formattedValue}
          </span>
          {unit && (
            <span className="text-xs text-muted-foreground">{unit}</span>
          )}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg
            ${trend.direction === 'up' ? 'text-emerald-600 bg-emerald-50' :
              trend.direction === 'down' ? 'text-red-600 bg-red-50' :
              'text-muted-foreground bg-secondary'
            }`}
          >
            <TrendIcon />
            {trend.change > 0 ? '+' : ''}{trend.change?.toFixed(1)}%
          </div>
        )}
      </div>

      {/* Geography & Metadata */}
      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {county_name && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {county_name}
          </span>
        )}
        {!county_name && entity_level === 'National' && (
          <span className="flex items-center gap-1">
            <Database className="h-3 w-3" />
            National
          </span>
        )}
        {year && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {year_range || year}
          </span>
        )}
      </div>

      {/* Mini Sparkline Chart */}
      {hasTimeSeries && chartData.length > 1 && (
        <div className="mt-3 h-12 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`gradient-${id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#004d99" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#004d99" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#004d99"
                strokeWidth={2}
                fill={`url(#gradient-${id})`}
                dot={{ r: 1.5, fill: '#004d99' }}
                activeDot={{ r: 4, fill: '#004d99' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Source & Actions */}
      <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground truncate max-w-[150px]">
          <Hash className="h-3 w-3 shrink-0" />
          <span className="truncate">{source_mcda || 'Unknown'}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onDownload(indicator)}
            className="p-1 rounded-lg hover:bg-secondary/50 transition-colors"
            title="Download"
          >
            <Download className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-3 pt-2 border-t border-border/50 space-y-1.5">
          {subdomain_name && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Subdomain</span>
              <span className="text-foreground font-medium">{subdomain_name}</span>
            </div>
          )}
          {domain_name && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Domain</span>
              <span className="text-foreground font-medium">{domain_name}</span>
            </div>
          )}
          {indicator_id && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Indicator ID</span>
              <span className="text-foreground font-mono text-[10px]">{indicator_id}</span>
            </div>
          )}
          {values && values.length > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Data Points</span>
              <span className="text-foreground font-medium">{values.length} years</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
