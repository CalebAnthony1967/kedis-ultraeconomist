import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  searchExplorer,
  getDomainTree,
  getAllFilterOptions,
  getEntityLevelCounts,
} from '@/lib/explorerAPI';
import { classifyQuery } from '@/lib/ai/classifier';
import { saveConversation, loadConversations } from '@/lib/ai/memory';

export function useExplorerData() {
  // ============================================================
  // STATE
  // ============================================================
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
    entityLevels: ['National', 'County', 'Sub-County', 'Ward'],
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
    entityLevels: ['National', 'County', 'Sub-County', 'Ward'],
    sortBy: 'relevance',
    sortOrder: 'desc',
    limit: 20,
    offset: 0,
  });

  // ============================================================
  // AI & STRUCTURED CONTEXT STATE (Borrowed from Copilot)
  // ============================================================
  const [lastClassification, setLastClassification] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [isAIActive, setIsAIActive] = useState(false);
  const [aiConfidence, setAiConfidence] = useState(0);
  const [missingEntities, setMissingEntities] = useState([]);
  const [detectedGeography, setDetectedGeography] = useState(null);
  const [detectedIntent, setDetectedIntent] = useState(null);
  const [citations, setCitations] = useState([]);

  // ============================================================
  // DERIVED STATE
  // ============================================================
  const entityCounts = useMemo(() => getEntityLevelCounts(results), [results]);
  const currentPage = Math.floor(filters.offset / filters.limit) + 1;
  const totalPages = Math.ceil(totalCount / filters.limit);

  // ============================================================
  // LOAD INITIAL DATA
  // ============================================================
  useEffect(() => {
    loadInitialData();
    loadConversationsList();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [tree, options] = await Promise.all([
        getDomainTree(),
        getAllFilterOptions(),
      ]);
      setDomainTree(tree);
      setFilterOptions(prev => ({
        ...prev,
        ...options,
        entityLevels: ['National', 'County', 'Sub-County', 'Ward'],
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversationsList = async () => {
    try {
      const list = await loadConversations(20);
      setConversations(list);
    } catch (e) {
      // RLS may block — fail silently
    }
  };

  // ============================================================
  // SEARCH
  // ============================================================
  const search = useCallback(async (searchFilters = {}) => {
    const mergedFilters = { ...filters, ...searchFilters };
    setFilters(mergedFilters);
    setIsLoading(true);
    setError(null);
    setCitations([]);
    setMissingEntities([]);

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

      // Generate AI insights automatically
      if (data.length > 0) {
        await generateAIInsights(data);
      }

    } catch (err) {
      setError(err.message);
      setResults([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // ============================================================
  // AI: CLASSIFY QUERY (Borrowed from Copilot)
  // ============================================================
  const classifyUserQuery = useCallback(async (query) => {
    if (!query || query.trim().length === 0) return null;

    setIsAIActive(true);
    try {
      const classification = await classifyQuery(query);
      
      // Update state
      setLastClassification(classification);
      setDetectedGeography(classification.geography);
      setDetectedIntent(classification.intent);
      setAiConfidence(classification.confidence || 0.8);

      // If geography detected, auto-apply filter
      if (classification.geography?.type === 'county' && classification.geography?.code) {
        // We'll let the caller decide whether to auto-apply
        return classification;
      }

      return classification;
    } catch (error) {
      console.error('Query classification failed:', error);
      return null;
    } finally {
      setIsAIActive(false);
    }
  }, []);

  // ============================================================
  // AI: GENERATE INSIGHTS FROM RESULTS (Borrowed from Copilot)
  // ============================================================
  const generateAIInsights = useCallback(async (data) => {
    if (!data || data.length === 0) {
      setCitations([]);
      setMissingEntities([]);
      setAiConfidence(0.5);
      return;
    }

    try {
      // Extract SPIs from data
      const spis = data.map(d => d.spi).filter(Boolean);
      setCitations(spis.slice(0, 10));

      // Check for missing data patterns
      const values = data.map(d => d.value).filter(v => v !== null && v !== undefined);
      if (values.length < data.length) {
        setMissingEntities(['Some values are missing or null']);
      }

      // Set confidence based on data completeness
      const confidence = Math.min(0.5 + (data.length / 100) * 0.5, 0.95);
      setAiConfidence(confidence);

    } catch (error) {
      console.error('Insight generation failed:', error);
    }
  }, []);

  // ============================================================
  // AI: SAVE STRUCTURED TURN (Borrowed from Copilot)
  // ============================================================
  const saveStructuredTurn = useCallback(async (turnData) => {
    const { query, classification, answer, spiCitations, retrievedIndicatorIds, analytics } = turnData;
    if (!conversationId) return;

    try {
      const { data: conv, error } = await supabase
        .from('copilot_conversations')
        .select('messages')
        .eq('id', conversationId)
        .single();

      if (error) throw error;

      const messages = conv.messages || [];
      const newMessages = [
        ...messages,
        {
          role: 'user',
          content: query,
          entities: classification?.entities || [],
          intent: classification?.intent || 'fact',
        },
        {
          role: 'assistant',
          content: answer,
          spi_citations: spiCitations || [],
          probability_score: analytics?.probability || null,
        },
      ];

      const structuredContext = {
        last_intent: classification?.intent || 'fact',
        last_entities: classification?.entities || [],
        last_geography: classification?.geography || 'national',
        last_time_range: classification?.time_range || { start: 2000, end: new Date().getFullYear() },
        last_pillars: classification?.pillars || [],
      };

      await supabase
        .from('copilot_conversations')
        .update({
          messages: newMessages,
          structured_context: structuredContext,
          retrieved_indicator_ids: retrievedIndicatorIds || [],
          analysis: analytics || {},
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

    } catch (error) {
      console.warn('Failed to save structured turn:', error);
    }
  }, [conversationId]);

  // ============================================================
  // FILTER UPDATES
  // ============================================================
  const updateFilter = useCallback((key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      offset: 0,
    }));
  }, []);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      offset: 0,
    }));
  }, []);

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
      entityLevels: ['National', 'County', 'Sub-County', 'Ward'],
      sortBy: 'relevance',
      sortOrder: 'desc',
      limit: 20,
      offset: 0,
    });
    setLastClassification(null);
    setDetectedGeography(null);
    setDetectedIntent(null);
    setCitations([]);
    setMissingEntities([]);
    setAiConfidence(0);
  }, []);

  const goToPage = useCallback((page) => {
    const offset = (page - 1) * filters.limit;
    setFilters(prev => ({ ...prev, offset }));
  }, [filters.limit]);

  const setPageSize = useCallback((size) => {
    setFilters(prev => ({
      ...prev,
      limit: size,
      offset: 0,
    }));
  }, []);

  // ============================================================
  // AI STATUS HELPERS
  // ============================================================
  const getConfidenceColor = (value) => {
    if (value >= 0.7) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    if (value >= 0.4) return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    return 'bg-red-500/10 text-red-600 border-red-500/20';
  };

  const getConfidenceLabel = (value) => {
    if (value >= 0.7) return 'High';
    if (value >= 0.4) return 'Medium';
    return 'Low';
  };

  // ============================================================
  // EXPORTS
  // ============================================================
  return {
    // Data
    results,
    totalCount,
    isLoading,
    error,
    domainTree,
    filterOptions,
    entityCounts,

    // Filters
    filters,
    currentPage,
    totalPages,

    // AI & Structured Context
    lastClassification,
    setLastClassification,
    conversationId,
    setConversationId,
    conversations,
    loadConversationsList,
    isAIActive,
    aiConfidence,
    missingEntities,
    detectedGeography,
    detectedIntent,
    citations,

    // AI Actions
    classifyUserQuery,
    generateAIInsights,
    saveStructuredTurn,

    // AI Helpers
    getConfidenceColor,
    getConfidenceLabel,

    // Filter Actions
    search,
    updateFilter,
    updateFilters,
    clearFilters,
    goToPage,
    setPageSize,
  };
}

export default useExplorerData;
