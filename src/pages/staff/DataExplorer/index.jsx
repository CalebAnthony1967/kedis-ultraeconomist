import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { useExplorerData } from './hooks/useExplorerData';
import SearchBar from './components/SearchBar';
import DomainTree from './components/DomainTree';
import DataCard from './components/DataCard';
import ControlBar from './components/ControlBar';
import FilterDrawer from './components/FilterDrawer';
import ChartView from './components/ChartView';
import EntityLevelSelector from './components/EntityLevelSelector';
import { getEntityLevelCounts } from '@/lib/explorerAPI';
import {
  Database,
  Loader2,
  X,
  Filter,
  BarChart3,
  MapPin,
  TrendingUp,
  Activity
} from 'lucide-react';

export default function DataExplorer() {
  const { lang } = useLanguage();
  const {
    results,
    totalCount,
    isLoading,
    error,
    domainTree,
    filterOptions,
    filters,
    search,
    updateFilter,
    updateFilters,
    clearFilters,
    goToPage,
    setPageSize,
  } = useExplorerData();

  const [viewMode, setViewMode] = useState('card');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedIndicatorId, setSelectedIndicatorId] = useState(null);
  const [selectedEntityLevel, setSelectedEntityLevel] = useState('all');

  // Entity level counts
  const entityCounts = getEntityLevelCounts(results);

  // Initial search on load
  useEffect(() => {
    search();
  }, []);

  // Search when filters change
  useEffect(() => {
    // Apply entity level filter
    const entityLevels = selectedEntityLevel === 'all' 
      ? ['National', 'County', 'Sub-County', 'Ward']
      : [selectedEntityLevel];
    
    updateFilter('entityLevels', entityLevels);
    search();
  }, [
    filters.domainIds,
    filters.subdomainIds,
    filters.pillars,
    filters.countyCodes,
    filters.sourceMcdas,
    filters.yearStart,
    filters.yearEnd,
    filters.sortBy,
    filters.limit,
    filters.offset,
    selectedEntityLevel,
  ]);

  const handleSearch = (query) => {
    updateFilter('query', query);
    search({ query });
  };

  const handleSortChange = (sortBy) => {
    updateFilter('sortBy', sortBy);
  };

  const handlePageSizeChange = (limit) => {
    setPageSize(limit);
  };

  const handleViewIndicator = (indicator) => {
    setSelectedIndicatorId(indicator.id);
    // Scroll to chart section
    const chartSection = document.getElementById('chart-section');
    if (chartSection) {
      chartSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleDownload = (indicator) => {
    console.log('Download indicator:', indicator);
    // Implement download logic
  };

  const handleApplyFilters = (newFilters) => {
    updateFilters(newFilters);
    setIsFilterOpen(false);
  };

  const currentPage = Math.floor(filters.offset / filters.limit) + 1;
  const totalPages = Math.ceil(totalCount / filters.limit);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">Data Explorer</h1>
              <p className="text-xs text-muted-foreground">
                {lang === 'sw' 
                  ? 'Gundua, elewa, na pakua data kutoka kwenye Hifadhi ya Data ya Kenya'
                  : 'Discover, visualise, and download data from Kenya\'s Sovereign Data Pool'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Database className="h-3.5 w-3.5" />
                {totalCount.toLocaleString()} indicators
              </div>
            </div>
          </div>

          {/* Entity Level Filter */}
          <div className="mt-3">
            <EntityLevelSelector
              selected={selectedEntityLevel}
              onChange={(level) => {
                setSelectedEntityLevel(level);
                const entityLevels = level === 'all' 
                  ? ['National', 'County', 'Sub-County', 'Ward']
                  : [level];
                updateFilter('entityLevels', entityLevels);
              }}
              counts={entityCounts}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <div className="hidden lg:block w-72 border-r border-border bg-card overflow-y-auto">
          <div className="p-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {lang === 'sw' ? 'Vikoa' : 'Domains'}
            </h2>
            <DomainTree
              data={domainTree}
              selectedSubdomainId={filters.subdomainIds?.[0]}
              onSelectSubdomain={(subdomainId) => {
                updateFilter('subdomainIds', [subdomainId]);
              }}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Search Bar */}
          <div className="border-b border-border bg-card px-4 lg:px-8 py-3">
            <div className="max-w-4xl">
              <SearchBar
                value={filters.query}
                onChange={(query) => handleSearch(query)}
                onSearch={handleSearch}
                isLoading={isLoading}
                placeholder={lang === 'sw'
                  ? 'Tafuta viashiria, mada, maeneo...'
                  : 'Search indicators, topics, locations...'
                }
                suggestions={filterOptions.domains?.map(d => d.name) || []}
              />
            </div>
          </div>

          {/* Control Bar */}
          <div className="border-b border-border bg-card px-4 lg:px-8 py-3">
            <div className="max-w-7xl mx-auto">
              <ControlBar
                totalCount={totalCount}
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={filters.limit}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                onSortChange={handleSortChange}
                onPageSizeChange={handlePageSizeChange}
                onToggleFilter={() => setIsFilterOpen(!isFilterOpen)}
                isFilterOpen={isFilterOpen}
                sortBy={filters.sortBy}
              />
            </div>
          </div>

          {/* Results Area */}
          <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Loading State */}
              {isLoading && !results.length && (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
                  <p className="text-sm text-muted-foreground">
                    {lang === 'sw' ? 'Inapakia viashiria...' : 'Loading indicators...'}
                  </p>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="rounded-full bg-red-500/10 p-4 mb-4">
                    <X className="h-8 w-8 text-red-500" />
                  </div>
                  <p className="text-sm text-red-500 font-medium">{error}</p>
                  <button
                    onClick={() => search()}
                    className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
                  >
                    {lang === 'sw' ? 'Jaribu Tena' : 'Retry'}
                  </button>
                </div>
              )}

              {/* Results */}
              {!isLoading && !error && results.length > 0 && (
                <>
                  {viewMode === 'card' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {results.map((indicator) => (
                        <DataCard
                          key={indicator.id}
                          indicator={indicator}
                          onView={handleViewIndicator}
                          onDownload={handleDownload}
                        />
                      ))}
                    </div>
                  )}

                  {viewMode === 'table' && (
                    <div className="rounded-xl border border-border bg-card overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-secondary/50 border-b border-border">
                            <tr>
                              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                                {lang === 'sw' ? 'Kiashiria' : 'Indicator'}
                              </th>
                              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                                {lang === 'sw' ? 'Kiwango' : 'Level'}
                              </th>
                              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Year</th>
                              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Value</th>
                              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Unit</th>
                              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">Source</th>
                              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                                {lang === 'sw' ? 'Eneo' : 'Geography'}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {results.map((indicator) => (
                              <tr
                                key={indicator.id}
                                className="border-b border-border/50 hover:bg-secondary/20 transition-colors cursor-pointer"
                                onClick={() => handleViewIndicator(indicator)}
                              >
                                <td className="px-4 py-3 font-medium text-foreground">{indicator.name}</td>
                                <td className="px-4 py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium
                                    ${indicator.entity_level === 'National' ? 'bg-primary/10 text-primary' :
                                      indicator.entity_level === 'County' ? 'bg-emerald-500/10 text-emerald-600' :
                                      indicator.entity_level === 'Sub-County' ? 'bg-amber-500/10 text-amber-600' :
                                      'bg-purple-500/10 text-purple-600'}`}
                                  >
                                    {indicator.entity_level || 'National'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">{indicator.year || '-'}</td>
                                <td className="px-4 py-3 text-foreground font-medium">
                                  {indicator.value?.toLocaleString() || '-'}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">{indicator.unit || '-'}</td>
                                <td className="px-4 py-3 text-muted-foreground truncate max-w-[150px]">
                                  {indicator.source_mcda || '-'}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                  {indicator.county_name || indicator.entity_level || 'National'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {viewMode === 'chart' && (
                    <div id="chart-section">
                      <ChartView
                        indicators={results}
                        selectedIndicatorId={selectedIndicatorId}
                        onSelectIndicator={setSelectedIndicatorId}
                        onExport={handleDownload}
                      />
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between gap-4">
                      <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="px-4 py-2 rounded-lg border border-border text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary"
                      >
                        {lang === 'sw' ? 'Iliyopita' : 'Previous'}
                      </button>
                      <span className="text-sm text-muted-foreground">
                        {lang === 'sw' ? 'Ukurasa' : 'Page'} {currentPage} {lang === 'sw' ? 'ya' : 'of'} {totalPages}
                      </span>
                      <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="px-4 py-2 rounded-lg border border-border text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary"
                      >
                        {lang === 'sw' ? 'Ijayo' : 'Next'}
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Empty State */}
              {!isLoading && !error && results.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20">
                  <Database className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground">
                    {lang === 'sw' ? 'Hakuna matokeo' : 'No results found'}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md text-center mt-1">
                    {lang === 'sw'
                      ? 'Jaribu kubadilisha vichujio au maneno ya utafutaji'
                      : 'Try adjusting your filters or search terms'}
                  </p>
                  <button
                    onClick={clearFilters}
                    className="mt-4 px-4 py-2 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-secondary/80"
                  >
                    {lang === 'sw' ? 'Futa vichujio vyote' : 'Clear all filters'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        filterOptions={filterOptions}
        onApplyFilters={handleApplyFilters}
        onClearFilters={clearFilters}
      />
    </div>
  );
}
