import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  searchExplorer,
  getDomainTree,
  getAllFilterOptions,
} from '@/lib/explorerAPI';

export function useExplorerData() {
  // State
  const [results, setResults] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [domainTree, setDomainTree] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    domains: [],
    years: [],
    sources: [],
    pillars: [],
    counties: [],
  });

  // Filter state
  const [filters, setFilters] = useState({
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

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [tree, options] = await Promise.all([
        getDomainTree(),
        getAllFilterOptions(),
      ]);
      setDomainTree(tree);
      setFilterOptions(options);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Search
  const search = useCallback(async (searchFilters = {}) => {
    const mergedFilters = { ...filters, ...searchFilters };
    setFilters(mergedFilters);
    setIsLoading(true);
    setError(null);

    try {
      const { data, totalCount: count } = await searchExplorer({
        query: mergedFilters.query,
        domainIds: mergedFilters.domainIds,
        subdomainIds: mergedFilters.subdomainIds,
        pillars: mergedFilters.pillars,
        countyCodes: mergedFilters.countyCodes,
        sourceMcdas: mergedFilters.sourceMcdas,
        yearStart: mergedFilters.yearStart,
        yearEnd: mergedFilters.yearEnd,
        entityLevels: mergedFilters.entityLevels,
        sortBy: mergedFilters.sortBy,
        sortOrder: mergedFilters.sortOrder,
        limit: mergedFilters.limit,
        offset: mergedFilters.offset,
      });

      setResults(data);
      setTotalCount(count);
    } catch (err) {
      setError(err.message);
      setResults([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Update a single filter
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: 0, // Reset pagination when filter changes
    }));
  }, []);

  // Update multiple filters at once
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      offset: 0,
    }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
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
  }, []);

  // Go to page
  const goToPage = useCallback((page) => {
    const offset = (page - 1) * filters.limit;
    setFilters(prev => ({ ...prev, offset }));
  }, [filters.limit]);

  // Set page size
  const setPageSize = useCallback((size) => {
    setFilters(prev => ({
      ...prev,
      limit: size,
      offset: 0,
    }));
  }, []);

  return {
    // Data
    results,
    totalCount,
    isLoading,
    error,
    domainTree,
    filterOptions,

    // Filters
    filters,
    setFilters,

    // Actions
    search,
    updateFilter,
    updateFilters,
    clearFilters,
    goToPage,
    setPageSize,
  };
}
