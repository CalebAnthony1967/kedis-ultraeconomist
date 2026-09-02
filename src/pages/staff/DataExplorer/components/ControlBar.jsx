import React from 'react';
import {
  LayoutGrid,
  Table,
  BarChart3,
  Filter,
  X,
} from 'lucide-react';

export default function ControlBar({
  totalCount = 0,
  currentPage = 1,
  pageSize = 20,
  totalPages = 1,
  viewMode = 'card',
  onViewModeChange = () => {},
  onSortChange = () => {},
  onPageSizeChange = () => {},
  onToggleFilter = () => {},
  isFilterOpen = false,
  sortBy = 'relevance',
  sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'name', label: 'Name (A-Z)' },
    { value: 'year', label: 'Year' },
    { value: 'source', label: 'Source' },
  ],
  className = '',
}) {
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 ${className}`}>
      {/* Left side - Result counter */}
      <div className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{startIndex}</span> to{' '}
        <span className="font-medium text-foreground">{endIndex}</span> of{' '}
        <span className="font-medium text-foreground">{totalCount.toLocaleString()}</span> results
      </div>

      {/* Right side - Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* View Toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-border p-1">
          <button
            onClick={() => onViewModeChange('card')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'card'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary'
            }`}
            title="Card view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => onViewModeChange('table')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'table'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary'
            }`}
            title="Table view"
          >
            <Table className="h-4 w-4" />
          </button>
          <button
            onClick={() => onViewModeChange('chart')}
            className={`p-1.5 rounded-md transition-colors ${
              viewMode === 'chart'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary'
            }`}
            title="Chart view"
          >
            <BarChart3 className="h-4 w-4" />
          </button>
        </div>

        {/* Sort Dropdown */}
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-3 py-1 text-sm outline-none focus:ring-1 focus:ring-primary"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              Sort by: {opt.label}
            </option>
          ))}
        </select>

        {/* Page Size */}
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(parseInt(e.target.value))}
          className="h-9 rounded-lg border border-input bg-background px-3 py-1 text-sm outline-none focus:ring-1 focus:ring-primary"
        >
          {[20, 50, 100].map((size) => (
            <option key={size} value={size}>
              {size} per page
            </option>
          ))}
        </select>

        {/* Filter Toggle */}
        <button
          onClick={onToggleFilter}
          className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border transition-colors ${
            isFilterOpen
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:bg-secondary'
          }`}
        >
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filters</span>
          {isFilterOpen && <X className="h-3.5 w-3.5 ml-0.5" />}
        </button>
      </div>
    </div>
  );
}
