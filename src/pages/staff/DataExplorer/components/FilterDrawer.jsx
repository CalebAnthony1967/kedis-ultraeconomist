import React, { useState } from 'react';
import {
  X,
  Filter,
  Check,
  ChevronDown,
  ChevronRight,
  Sliders,
} from 'lucide-react';

export default function FilterDrawer({
  isOpen,
  onClose,
  filters,
  filterOptions,
  onApplyFilters,
  onClearFilters,
}) {
  const [localFilters, setLocalFilters] = useState(filters);

  // Update when filters prop changes
  React.useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
  };

  const handleClear = () => {
    onClearFilters();
    setLocalFilters({
      query: '',
      domainIds: [],
      subdomainIds: [],
      pillars: [],
      countyCodes: [],
      sourceMcdas: [],
      yearStart: null,
      yearEnd: null,
      entityLevels: [],
      sortBy: 'relevance',
      sortOrder: 'desc',
      limit: 20,
      offset: 0,
    });
  };

  const activeFilterCount = Object.values(localFilters).filter(v =>
    Array.isArray(v) ? v.length > 0 : v !== null && v !== '' && v !== 0
  ).length;

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed top-0 right-0 w-full max-w-md h-full bg-background z-50 shadow-2xl animate-in slide-in-from-right">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Filters</h2>
              {activeFilterCount > 0 && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClear}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear all
              </button>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Domain Filter */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Domain</h3>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {filterOptions.domains.map((domain) => {
                  const isSelected = localFilters.domainIds?.includes(domain.id);
                  return (
                    <button
                      key={domain.id}
                      onClick={() => {
                        const current = localFilters.domainIds || [];
                        const updated = isSelected
                          ? current.filter(id => id !== domain.id)
                          : [...current, domain.id];
                        handleFilterChange('domainIds', updated);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isSelected
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-secondary/30 text-muted-foreground'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isSelected ? 'bg-primary border-primary' : 'border-border'
                      }`}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className="flex-1 text-left">{domain.name}</span>
                      <span className="text-xs">{domain.count || 0}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pillar Filter */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Pillar</h3>
              <div className="space-y-1">
                {filterOptions.pillars.map((pillar) => {
                  const isSelected = localFilters.pillars?.includes(pillar.pillar);
                  return (
                    <button
                      key={pillar.pillar}
                      onClick={() => {
                        const current = localFilters.pillars || [];
                        const updated = isSelected
                          ? current.filter(p => p !== pillar.pillar)
                          : [...current, pillar.pillar];
                        handleFilterChange('pillars', updated);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isSelected
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-secondary/30 text-muted-foreground'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isSelected ? 'bg-primary border-primary' : 'border-border'
                      }`}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className="flex-1 text-left">{pillar.pillar}</span>
                      <span className="text-xs">{pillar.count || 0}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Source Filter */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Source</h3>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {filterOptions.sources.map((source) => {
                  const isSelected = localFilters.sourceMcdas?.includes(source.source_mcda);
                  return (
                    <button
                      key={source.source_mcda}
                      onClick={() => {
                        const current = localFilters.sourceMcdas || [];
                        const updated = isSelected
                          ? current.filter(s => s !== source.source_mcda)
                          : [...current, source.source_mcda];
                        handleFilterChange('sourceMcdas', updated);
                      }}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isSelected
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-secondary/30 text-muted-foreground'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isSelected ? 'bg-primary border-primary' : 'border-border'
                      }`}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className="flex-1 text-left truncate">{source.source_mcda}</span>
                      <span className="text-xs">{source.count || 0}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Year Range */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-2">Year Range</h3>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={localFilters.yearStart || ''}
                  onChange={(e) => handleFilterChange('yearStart', parseInt(e.target.value) || null)}
                  placeholder="From"
                  className="w-1/2 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-muted-foreground">to</span>
                <input
                  type="number"
                  value={localFilters.yearEnd || ''}
                  onChange={(e) => handleFilterChange('yearEnd', parseInt(e.target.value) || null)}
                  placeholder="To"
                  className="w-1/2 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border flex gap-3">
            <button
              onClick={handleClear}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-semibold hover:bg-secondary transition-colors"
            >
              Clear all
            </button>
            <button
              onClick={handleApply}
              className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Apply filters
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
