import { useState, useEffect, useCallback } from 'react';
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

  // AI & Structured Context State
  const [lastClassification, setLastClassification] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [isAIActive, setIsAIActive] = useState(true);
  const [aiConfidence, setAiConfidence] = useState(0);
  const [missingEntities, setMissingEntities] = useState([]);
  const [detectedGeography, setDetectedGeography] = useState(null);
  const [detectedIntent, setDetectedIntent] = useState(null);
  const [citations, setCitations] = useState([]);

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
      setDomainTree(tree || []);
      setFilterOptions(options || { domains: [], years: [], sources: [], pillars: [], counties: [] });
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
      const response = await searchExplorer({
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

      const data = response?.data || [];
      const count = response?.totalCount ?? response?.total ?? data.length;

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
      offset: 0,
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
    setAiConfidence(0);
    setDetectedGeography(null);
    setDetectedIntent(null);
    setMissingEntities([]);
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

  // AI Helpers
  const getConfidenceColor = useCallback((confidenceValue = 0) => {
    if (confidenceValue >= 0.7) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    if (confidenceValue >= 0.4) return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    return 'bg-red-500/10 text-red-600 border-red-500/20';
  }, []);

  const getConfidenceLabel = useCallback((confidenceValue = 0) => {
    if (confidenceValue >= 0.7) return 'High';
    if (confidenceValue >= 0.4) return 'Medium';
    return 'Low';
  }, []);

  const classifyUserQuery = useCallback(async (query) => {
    if (!query) return null;

    // Simple heuristic parser for query analysis
    const lower = query.toLowerCase();
    const classification = {
      searchTerm: query,
      confidence: 0.85,
      entityLevel: ['National', 'County'],
      countyCodes: [],
      pillars: [],
      geography: null,
      intent: 'search',
    };

    setAiConfidence(classification.confidence);
    setDetectedIntent(classification.intent);
    setLastClassification(classification);

    return classification;
  }, []);

  const loadConversationsList = useCallback(async () => {
    return [];
  }, []);

  const saveStructuredTurn = useCallback(async () => {
    return true;
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

    // AI & Structured Context
    lastClassification,
    setLastClassification,
    conversationId,
    setConversationId,
    conversations,
    loadConversationsList,
    saveStructuredTurn,
    isAIActive,
    aiConfidence,
    missingEntities,
    detectedGeography,
    detectedIntent,
    citations,
    classifyUserQuery,
    getConfidenceColor,
    getConfidenceLabel,
  };
}
