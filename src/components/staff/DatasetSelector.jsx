import React, { useState } from 'react';
import {
  Database, ChevronDown, ChevronRight, FileSpreadsheet, FileJson, FileText,
  Layers, CheckCircle2, Loader2, RefreshCw, Search, Info, Filter,
  X, Globe, Tag, LayoutGrid
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const PILLARS = ['Economic', 'Social', 'Governance', 'Environmental', 'Political'];

const FileTypeIcon = ({ type, className }) => {
  if (type === 'JSON') return <FileJson className={className} />;
  if (type === 'CSV') return <FileText className={className} />;
  return <FileSpreadsheet className={className} />;
};

export default function DatasetSelector({
  jobs,
  selectedFilter = { type: 'all', label: 'All Sovereign Data' },
  onSelectFilter,
  isLoading,
  onRefresh,
  indicatorCounts,
}) {
  const [expandedSources, setExpandedSources] = useState({});
  const [search, setSearch] = useState('');

  // Get current filter values
  const currentPillars = selectedFilter.pillars || [];
  const currentGeography = selectedFilter.geography || '';

  const toggleSource = (source) => {
    setExpandedSources(prev => ({ ...prev, [source]: !prev[source] }));
  };

  // Toggle pillar selection
  const togglePillar = (pillar) => {
    let newPillars;
    if (currentPillars.includes(pillar)) {
      newPillars = currentPillars.filter(p => p !== pillar);
    } else {
      newPillars = [...currentPillars, pillar];
    }
    // Update filter while preserving source/job selection
    onSelectFilter({
      ...selectedFilter,
      pillars: newPillars,
    });
  };

  // Update geography
  const updateGeography = (geography) => {
    onSelectFilter({
      ...selectedFilter,
      geography: geography.trim() || undefined,
    });
  };

  // Clear all filters except source/job
  const clearFilters = () => {
    const baseFilter = { type: selectedFilter.type, value: selectedFilter.value, label: selectedFilter.label };
    onSelectFilter(baseFilter);
  };

  const filteredJobs = jobs.filter(j =>
    !search || j.file_name.toLowerCase().includes(search.toLowerCase()) ||
    j.source_mcda.toLowerCase().includes(search.toLowerCase())
  );

  // Group jobs by source_mcda
  const grouped = filteredJobs.reduce((acc, job) => {
    const key = job.source_mcda || 'Unknown Source';
    if (!acc[key]) acc[key] = [];
    acc[key].push(job);
    return acc;
  }, {});

  const sourceKeys = Object.keys(grouped).sort();

  const hasActiveFilters = (currentPillars.length > 0) || currentGeography;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          Data Repository
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              Select a dataset, pillar, or geography to focus the AI's RAG search. Use "All Sovereign Data" to search across everything.
            </TooltipContent>
          </Tooltip>
        </h3>
        <div className="flex items-center gap-1">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground transition-colors text-[10px] font-medium"
            >
              Clear filters
            </button>
          )}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            title="Refresh datasets"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2 border-b border-border space-y-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search datasets..."
            className="w-full rounded-md border border-input bg-background pl-8 pr-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Pillar filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-0.5">
            <Tag className="h-3 w-3" />
            Pillar:
          </span>
          {PILLARS.map(pillar => {
            const isSelected = currentPillars.includes(pillar);
            return (
              <button
                key={pillar}
                onClick={() => togglePillar(pillar)}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors
                  ${isSelected
                    ? 'bg-primary/10 text-primary border-primary/30 font-medium'
                    : 'bg-secondary/50 text-muted-foreground border-border hover:bg-secondary'
                  }`}
              >
                {pillar}
              </button>
            );
          })}
          {currentPillars.length > 0 && (
            <span className="text-[10px] text-muted-foreground">
              ({currentPillars.length} selected)
            </span>
          )}
        </div>

        {/* Geography filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-0.5">
            <Globe className="h-3 w-3" />
            Geography:
          </span>
          <input
            type="text"
            value={currentGeography}
            onChange={(e) => updateGeography(e.target.value)}
            placeholder="e.g. Nairobi, national, global"
            className="flex-1 min-w-[80px] rounded-md border border-input bg-background px-2 py-0.5 text-xs outline-none focus:ring-1 focus:ring-primary"
          />
          {currentGeography && (
            <button
              onClick={() => updateGeography('')}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* All Data option */}
        <button
          onClick={() => onSelectFilter({
            type: 'all',
            label: 'All Sovereign Data',
            pillars: currentPillars.length > 0 ? currentPillars : undefined,
            geography: currentGeography || undefined,
          })}
          className={`w-full px-4 py-3 flex items-center gap-2 text-left border-b border-border transition-colors
            ${selectedFilter?.type === 'all' && !selectedFilter?.value ? 'bg-primary/10' : 'hover:bg-secondary/30'}`}
        >
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0
            ${selectedFilter?.type === 'all' && !selectedFilter?.value ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
            <Database className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground">All Sovereign Data</p>
            <p className="text-[10px] text-muted-foreground">
              {indicatorCounts.total || 0} indicators across all sources
            </p>
          </div>
          {selectedFilter?.type === 'all' && !selectedFilter?.value && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
        </button>

        {/* Grouped by source */}
        {sourceKeys.map(source => {
          const sourceJobs = grouped[source];
          const isExpanded = expandedSources[source] || search.length > 0;
          const count = indicatorCounts[source] || 0;
          const isSourceSelected = selectedFilter?.type === 'source' && selectedFilter?.value === source;

          return (
            <div key={source} className="border-b border-border">
              <button
                onClick={() => toggleSource(source)}
                className="w-full px-4 py-2.5 flex items-center gap-2 text-left hover:bg-secondary/30 transition-colors"
              >
                {isExpanded
                  ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                <span className="text-xs font-semibold text-foreground truncate flex-1">{source}</span>
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                  {sourceJobs.length} file{sourceJobs.length !== 1 ? 's' : ''}
                </span>
                {isSourceSelected && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
              </button>

              {isExpanded && (
                <div className="pb-1">
                  {/* Source-level filter */}
                  <button
                    onClick={() => onSelectFilter({
                      type: 'source',
                      value: source,
                      label: source,
                      pillars: currentPillars.length > 0 ? currentPillars : undefined,
                      geography: currentGeography || undefined,
                    })}
                    className={`w-full pl-10 pr-4 py-2 flex items-center gap-2 text-left text-xs transition-colors
                      ${isSourceSelected ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/20 text-muted-foreground'}`}
                  >
                    <Database className="h-3 w-3" />
                    All {source} data
                    {count > 0 && <span className="text-[10px]">({count} indicators)</span>}
                  </button>

                  {/* Individual jobs */}
                  {sourceJobs.map(job => {
                    const isJobSelected = selectedFilter?.type === 'job' && selectedFilter?.value?.jobId === job.id;
                    return (
                      <button
                        key={job.id}
                        onClick={() => onSelectFilter({
                          type: 'job',
                          value: { jobId: job.id, source_mcda: job.source_mcda, temporal_year: job.temporal_year },
                          label: job.file_name,
                          pillars: currentPillars.length > 0 ? currentPillars : undefined,
                          geography: currentGeography || undefined,
                        })}
                        className={`w-full pl-10 pr-4 py-2 flex items-center gap-2 text-left transition-colors
                          ${isJobSelected ? 'bg-primary/10' : 'hover:bg-secondary/20'}`}
                      >
                        <FileTypeIcon type={job.file_type} className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs truncate ${isJobSelected ? 'text-primary font-medium' : 'text-foreground/80'}`}>
                            {job.file_name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {job.records_ingested || 0} records
                            {job.fair_score ? ` · FAIR ${job.fair_score}` : ''}
                          </p>
                        </div>
                        {isJobSelected && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {filteredJobs.length === 0 && !isLoading && (
          <div className="px-4 py-8 text-center">
            <Database className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              {search ? 'No datasets match your search' : 'No datasets uploaded yet'}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {search ? '' : 'Upload data via Admin → ETL Pipeline'}
            </p>
          </div>
        )}

        {isLoading && (
          <div className="px-4 py-8 text-center">
            <Loader2 className="h-6 w-6 text-primary animate-spin mx-auto" />
            <p className="text-xs text-muted-foreground mt-2">Loading datasets...</p>
          </div>
        )}
      </div>
    </div>
  );
}
