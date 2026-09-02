import React, { useState } from 'react';
import {
  Calendar,
  MapPin,
  Clock,
  Download,
  ExternalLink,
  Eye,
  Hash,
  TrendingUp,
  TrendingDown,
  Minus,
  Database,
  FileText
} from 'lucide-react';

export default function DataCard({
  indicator,
  onView = () => {},
  onDownload = () => {},
  className = '',
}) {
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
  } = indicator;

  // Determine trend icon
  const getTrendIcon = (val) => {
    if (!val) return <Minus className="h-3 w-3 text-muted-foreground" />;
    if (val > 0) return <TrendingUp className="h-3 w-3 text-emerald-500" />;
    if (val < 0) return <TrendingDown className="h-3 w-3 text-red-500" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

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

  return (
    <div
      className={`
        rounded-xl border border-border bg-card p-4
        transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5
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
        <button
          onClick={() => onView(indicator)}
          className="p-1 rounded-lg hover:bg-secondary transition-colors shrink-0"
        >
          <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </button>
      </div>

      {/* Title */}
      <div className="mt-2">
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 hover:text-primary transition-colors">
          {name}
        </h3>
      </div>

      {/* Geography & Value */}
      <div className="mt-2 flex items-center gap-3 flex-wrap">
        {county_name && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {county_name}
          </div>
        )}
        {!county_name && entity_level === 'National' && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Database className="h-3 w-3" />
            National
          </div>
        )}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {getTrendIcon(value)}
          <span className="font-medium text-foreground">{formattedValue}</span>
          {unit && <span className="text-muted-foreground">{unit}</span>}
        </div>
      </div>

      {/* Metadata Ribbon */}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground border-t border-border pt-2.5">
        {year && (
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {year}
          </div>
        )}
        {source_mcda && (
          <div className="flex items-center gap-1 truncate max-w-[150px]">
            <Hash className="h-3 w-3 shrink-0" />
            <span className="truncate">{source_mcda}</span>
          </div>
        )}
        {domain_name && (
          <div className="flex items-center gap-1">
            <span className="opacity-50">|</span>
            {domain_name}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-3 pt-2 border-t border-border/50 flex items-center gap-2">
        <button
          onClick={() => onDownload(indicator)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/5 text-primary text-xs font-medium hover:bg-primary/10 transition-colors"
        >
          <Download className="h-3 w-3" />
          Download
        </button>
        {subdomain_name && (
          <span className="text-[10px] text-muted-foreground ml-auto">
            {subdomain_name}
          </span>
        )}
      </div>
    </div>
  );
}
