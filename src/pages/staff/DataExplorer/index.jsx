import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/lib/i18n';
import { useExplorerData } from './hooks/useExplorerData';
import { useAISearch } from './hooks/useAISearch';
import SearchBar from './components/SearchBar';
import DomainTree from './components/DomainTree';
import DataCard from './components/DataCard';
import TableView from './components/TableView';
import ControlBar from './components/ControlBar';
import FilterDrawer from './components/FilterDrawer';
import ChartView from './components/ChartView';
import EntityLevelSelector from './components/EntityLevelSelector';
import InsightsPanel from './components/InsightsPanel';
import AIChatPanel from './components/AIChatPanel';
import { getEntityLevelCounts } from '@/lib/explorerAPI';
import {
  Database,
  Loader2,
  X,
  Filter,
  Brain,
  Sparkles,
  Mic,
  MicOff,
  MessageSquare,
  Grid3x3,
  Table2,
  BarChart3,
  Activity,
  Globe,
  MapPin,
  ChevronUp,
  Share2,
  Link2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================
// HELPER: Group indicators by name, show latest year
// ============================================================

/**
 * Group indicators by name/indicator_id and show latest year
 */
function groupIndicatorsByLatestYear(indicators) {
  const grouped = {};
  
  for (const indicator of indicators) {
    const key = indicator.indicator_id || indicator.name;
    if (!grouped[key]) {
      grouped[key] = {
        ...indicator,
        years: [indicator.year],
        values: [{ year: indicator.year, value: indicator.value }],
        year_range: `${indicator.year}`,
      };
    } else {
      // Add year to the list
      if (indicator.year && !grouped[key].years.includes(indicator.year)) {
        grouped[key].years.push(indicator.year);
        grouped[key].values.push({ year: indicator.year, value: indicator.value });
      }
      // Keep the latest year's value for display
      if (indicator.year > grouped[key].year) {
        grouped[key].year = indicator.year;
        grouped[key].value = indicator.value;
      }
      // Update year range
      if (indicator.year) {
        const years = grouped[key].years;
        grouped[key].year_range = `${Math.min(...years)} – ${Math.max(...years)}`;
      }
    }
  }
  
  // Sort years for each indicator
  for (const key of Object.keys(grouped)) {
    grouped[key].years.sort((a, b) => a - b);
    grouped[key].values.sort((a, b) => a.year - b.year);
  }
  
  return Object.values(grouped);
}

/**
 * Get display indicators (grouped by name, showing latest year)
 */
function getDisplayIndicators(indicators) {
  if (!indicators || indicators.length === 0) return [];
  
  // Check if we already have grouped data (has 'values' property)
  if (indicators[0]?.values) {
    return indicators;
  }
  
  // Group raw data
  return groupIndicatorsByLatestYear(indicators);
}

// ============================================================
// MAIN COMPONENT
// ============================================================

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

  const { translateQuery, isProcessing: isAISearching } = useAISearch();

  // State
  const [viewMode, setViewMode] = useState('card');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedIndicatorId, setSelectedIndicatorId] = useState(null);
  const [selectedEntityLevel, setSelectedEntityLevel] = useState('all');
  const [showAIChat, setShowAIChat] = useState(true);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInsights, setShowInsights] = useState(true);
  const [aiQuery, setAiQuery] = useState('');
  const [favourites, setFavourites] = useState([]);
  const recognitionRef = useRef(null);

  // Grouped indicators for display
  const displayIndicators = getDisplayIndicators(results);

  // Entity level counts
  const entityCounts = getEntityLevelCounts(results);

  // AI Insights
  const [insights, setInsights] = useState([]);

  // Initial search on load
  useEffect(() => {
    search();
  }, []);

  // Search when filters change
  useEffect(() => {
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

  const handleSearch = async (query) => {
    setSearchQuery(query);
    updateFilter('query', query);
    search({ query });
  };

  // AI-Powered Search
  const handleAISearch = async (query) => {
    if (!query || query.trim().length === 0) return;
    
    setAiQuery(query);
    const classification = await translateQuery(query);
    
    if (classification) {
      const newFilters = {
        query: classification.searchTerm || query,
        countyCodes: classification.countyCodes || [],
        entityLevels: classification.entityLevel || ['National', 'County'],
        yearStart: classification.yearStart || null,
        yearEnd: classification.yearEnd || null,
        pillars: classification.pillars || [],
      };
      
      updateFilters(newFilters);
      
      if (classification.geography && classification.geography !== 'national') {
        setSelectedEntityLevel('County');
      }
      
      search(newFilters);
    } else {
      handleSearch(query);
    }
  };

  const handleSortChange = (sortBy) => {
    updateFilter('sortBy', sortBy);
  };

  const handlePageSizeChange = (limit) => {
    setPageSize(limit);
  };

  const handleViewIndicator = (indicator) => {
    // Find the original indicator with all years
    const original = results.find(r => r.indicator_id === indicator.indicator_id || r.name === indicator.name);
    if (original) {
      setSelectedIndicatorId(original.id);
    } else {
      setSelectedIndicatorId(indicator.id);
    }
    const chartSection = document.getElementById('chart-section');
    if (chartSection) {
      chartSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleDownload = (indicator) => {
    console.log('Download indicator:', indicator);
    // Implement download logic
  };

  const handleFavourite = (indicator) => {
    const id = indicator.indicator_id || indicator.id;
    setFavourites(prev => {
      if (prev.includes(id)) {
        return prev.filter(f => f !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const isFavourite = (indicator) => {
    const id = indicator.indicator_id || indicator.id;
    return favourites.includes(id);
  };

  const handleApplyFilters = (newFilters) => {
    updateFilters(newFilters);
    setIsFilterOpen(false);
  };

  const handleAIFilterApply = (filters) => {
    updateFilters(filters);
    setIsFilterOpen(false);
  };

  const handleAIChatInsights = (newInsights) => {
    setInsights(newInsights);
  };

  // Voice Input
  const toggleVoiceInput = () => {
    if (isVoiceListening) {
      recognitionRef.current?.stop();
      setIsVoiceListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(lang === 'sw' ? 'Sauti haitumiki. Tumia Chrome au Edge.' : 'Voice not supported. Use Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'sw' ? 'sw-KE' : 'en-KE';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      handleAISearch(transcript);
      setIsVoiceListening(false);
    };

    recognition.onerror = () => {
      setIsVoiceListening(false);
      alert(lang === 'sw' ? 'Hitilafu ya sauti. Jaribu tena.' : 'Voice error. Please try again.');
    };

    recognition.onend = () => setIsVoiceListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsVoiceListening(true);
  };

  // Share functionality
  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: 'KEDIS Data Explorer',
        text: 'Check out this data from KEDIS UltraEconomist',
        url: url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        alert(lang === 'sw' ? 'URL imenakiliwa!' : 'URL copied to clipboard!');
      }).catch(() => {});
    }
  };

  const currentPage = Math.floor(filters.offset / filters.limit) + 1;
  const totalPages = Math.ceil(totalCount / filters.limit);

  const viewModes = [
    { id: 'card', icon: Grid3x3, label: lang === 'sw' ? 'Kadi' : 'Cards' },
    { id: 'table', icon: Table2, label: lang === 'sw' ? 'Jedwali' : 'Table' },
    { id: 'chart', icon: BarChart3, label: lang === 'sw' ? 'Chati' : 'Chart' },
  ];

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* ============================================================ */}
      {/* HEADER WITH GLASSMORPHISM */}
      {/* ============================================================ */}
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-white/70 dark:bg-slate-950/70 border-b border-border/50 px-4 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 shadow-lg shadow-primary/20">
                <Database className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                  <span className="bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">
                    {lang === 'sw' ? 'Kichunguzi Data' : 'Data Explorer'}
                  </span>
                  <span className="text-xs font-normal bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                    {lang === 'sw' ? 'Beta' : 'Beta'}
                  </span>
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  {lang === 'sw' 
                    ? 'Gundua, elewa, na pakua data kutoka Hifadhi ya Data ya Kenya'
                    : 'Discover, visualise, and download data from Kenya\'s Sovereign Data Pool'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* AI Status */}
              <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-emerald-500/10 border border-primary/20">
                <Brain className="h-3.5 w-3.5 text-primary animate-pulse" />
                <span className="text-xs font-medium text-primary">
                  {lang === 'sw' ? 'AI Imewashwa' : 'AI Active'}
                </span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>

              {/* Share Button */}
              <button
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/50 text-xs font-medium hover:bg-secondary/50 transition-colors"
              >
                <Share2 className="h-3.5 w-3.5" />
                {lang === 'sw' ? 'Shiriki' : 'Share'}
              </button>

              {/* Total Counter */}
              <div className="inline-flex items-center gap-1.5 rounded-full bg-secondary/50 px-3 py-1.5 text-xs font-semibold text-foreground border border-border/50">
                <Database className="h-3.5 w-3.5 text-primary" />
                {displayIndicators.length} {lang === 'sw' ? 'viashiria' : 'indicators'}
                <span className="text-[10px] text-muted-foreground">
                  ({results.length} {lang === 'sw' ? 'rekodi' : 'records'})
                </span>
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

      {/* ============================================================ */}
      {/* MAIN CONTENT */}
      {/* ============================================================ */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT SIDEBAR - Domain Tree */}
        <div className="hidden lg:block w-72 border-r border-border/50 bg-card/30 backdrop-blur-sm overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
                <Globe className="h-3.5 w-3.5 text-primary" />
              </div>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {lang === 'sw' ? 'Vikoa na Viashiria' : 'Domains & Indicators'}
              </h2>
            </div>
            <DomainTree
              data={domainTree}
              selectedSubdomainId={filters.subdomainIds?.[0]}
              onSelectSubdomain={(subdomainId) => {
                updateFilter('subdomainIds', [subdomainId]);
              }}
            />
          </div>
        </div>

        {/* ============================================================ */}
        {/* MAIN CONTENT AREA */}
        {/* ============================================================ */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Search & Controls Bar */}
          <div className="bg-card/50 backdrop-blur-sm border-b border-border/50 px-4 lg:px-6 py-3">
            <div className="max-w-full">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex-1 w-full">
                  <div className="relative">
                    <SearchBar
                      value={searchQuery}
                      onChange={(query) => setSearchQuery(query)}
                      onSearch={handleAISearch}
                      isLoading={isLoading || isAISearching}
                      placeholder={lang === 'sw'
                        ? 'Tafuta viashiria au uliza AI...'
                        : 'Search indicators or ask AI...'
                      }
                      suggestions={filterOptions.domains?.map(d => d.name) || []}
                      className="w-full"
                    />
                    <button
                      onClick={toggleVoiceInput}
                      className={`absolute right-12 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all
                        ${isVoiceListening 
                          ? 'text-red-500 bg-red-100 animate-pulse' 
                          : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                        }`}
                      title={lang === 'sw' ? 'Ingiza kwa sauti' : 'Voice input'}
                    >
                      {isVoiceListening ? (
                        <MicOff className="h-4 w-4" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </button>
                    {isAISearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="flex items-center gap-1.5">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span className="text-[10px] text-primary font-medium hidden sm:inline">
                            {lang === 'sw' ? 'AI inatafuta...' : 'AI searching...'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowAIChat(!showAIChat)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all
                      ${showAIChat 
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
                        : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                      }`}
                  >
                    <MessageSquare className="h-4 w-4" />
                    {lang === 'sw' ? 'AI Chat' : 'AI Chat'}
                  </button>
                  <button
                    onClick={() => setShowInsights(!showInsights)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all
                      ${showInsights 
                        ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' 
                        : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                      }`}
                  >
                    <Activity className="h-4 w-4" />
                    {lang === 'sw' ? 'Uchambuzi' : 'Insights'}
                  </button>
                  <button
                    onClick={() => setIsFilterOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-secondary/50 text-muted-foreground hover:bg-secondary text-xs font-medium transition-all"
                  >
                    <Filter className="h-4 w-4" />
                    {lang === 'sw' ? 'Vichujio' : 'Filters'}
                  </button>
                </div>
              </div>

              {/* AI Query Display */}
              {aiQuery && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/5 border border-primary/20">
                    <Sparkles className="h-3 w-3 text-primary" />
                    <span className="text-[10px] text-primary font-medium">
                      {lang === 'sw' ? 'Swali la AI' : 'AI Query'}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground italic">
                    "{aiQuery}"
                  </span>
                  <button
                    onClick={() => setAiQuery('')}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* AI CHAT & INSIGHTS PANELS */}
          {/* ============================================================ */}
          <AnimatePresence>
            {(showAIChat || showInsights) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden border-b border-border/50 bg-card/30 backdrop-blur-sm"
              >
                <div className="grid lg:grid-cols-2 gap-4 p-4 max-h-80 overflow-y-auto">
                  {showAIChat && (
                    <AIChatPanel
                      currentFilters={filters}
                      results={results}
                      onApplyFilters={handleAIFilterApply}
                      onGenerateReport={() => console.log('Generate report')}
                      lang={lang}
                      className="min-h-[200px]"
                    />
                  )}
                  {showInsights && (
                    <InsightsPanel
                      data={displayIndicators}
                      onGenerate={handleAIChatInsights}
                      className="min-h-[200px]"
                      lang={lang}
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ============================================================ */}
          {/* CONTROL BAR */}
          {/* ============================================================ */}
          <div className="bg-card/30 backdrop-blur-sm border-b border-border/50 px-4 lg:px-6 py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* View Toggle */}
              <div className="flex items-center gap-1 rounded-lg bg-secondary/30 p-0.5 border border-border/50">
                {viewModes.map((mode) => {
                  const Icon = mode.icon;
                  const isActive = viewMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setViewMode(mode.id)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5
                        ${isActive 
                          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                        }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{mode.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Result Counter */}
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {displayIndicators.length > 0 ? 1 : 0}
                </span>
                {' - '}
                <span className="font-medium text-foreground">
                  {displayIndicators.length}
                </span>
                {' '}{lang === 'sw' ? 'ya' : 'of'} {displayIndicators.length} {lang === 'sw' ? 'viashiria' : 'indicators'}
                <span className="text-[10px] text-muted-foreground/60 ml-2">
                  ({results.length} {lang === 'sw' ? 'rekodi' : 'records'})
                </span>
              </div>

              {/* Sort & Page Size */}
              <div className="flex items-center gap-2">
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="h-8 rounded-lg border border-input bg-background px-2.5 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="relevance">{lang === 'sw' ? 'Umuhimu' : 'Relevance'}</option>
                  <option value="name">{lang === 'sw' ? 'Jina' : 'Name'}</option>
                  <option value="year">{lang === 'sw' ? 'Mwaka' : 'Year'}</option>
                  <option value="source">{lang === 'sw' ? 'Chanzo' : 'Source'}</option>
                </select>
                <select
                  value={filters.limit}
                  onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                  className="h-8 rounded-lg border border-input bg-background px-2.5 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
                >
                  {[20, 50, 100].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* RESULTS AREA */}
          {/* ============================================================ */}
          <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Loading State */}
              {isLoading && !displayIndicators.length && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="relative">
                    <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Database className="h-5 w-5 text-primary/60" />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    {lang === 'sw' ? 'Inapakia data...' : 'Loading data...'}
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
              {!isLoading && !error && displayIndicators.length > 0 && (
                <>
                  {/* Card View */}
                  {viewMode === 'card' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {displayIndicators.map((indicator) => (
                        <DataCard
                          key={indicator.indicator_id || indicator.id || indicator.name}
                          indicator={indicator}
                          onView={handleViewIndicator}
                          onDownload={handleDownload}
                          onFavourite={handleFavourite}
                          isFavourite={isFavourite(indicator)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Table View - NEW */}
                  {viewMode === 'table' && (
                    <TableView
                      data={displayIndicators}
                      onRowClick={handleViewIndicator}
                      lang={lang}
                    />
                  )}

                  {/* Chart View */}
                  {viewMode === 'chart' && (
                    <div id="chart-section">
                      <ChartView
                        indicators={results}
                        selectedIndicatorId={selectedIndicatorId}
                        onSelectIndicator={setSelectedIndicatorId}
                        onExport={handleDownload}
                        lang={lang}
                      />
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between gap-4 pt-4">
                      <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="px-4 py-2 rounded-lg border border-border/50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary/50 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <ChevronUp className="h-4 w-4 rotate-90" />
                          {lang === 'sw' ? 'Iliyopita' : 'Previous'}
                        </span>
                      </button>
                      <span className="text-sm text-muted-foreground">
                        {lang === 'sw' ? 'Ukurasa' : 'Page'} <span className="font-medium text-foreground">{currentPage}</span> {lang === 'sw' ? 'ya' : 'of'} <span className="font-medium text-foreground">{totalPages}</span>
                      </span>
                      <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="px-4 py-2 rounded-lg border border-border/50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary/50 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          {lang === 'sw' ? 'Ijayo' : 'Next'}
                          <ChevronUp className="h-4 w-4 -rotate-90" />
                        </span>
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Empty State */}
              {!isLoading && !error && displayIndicators.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="relative">
                    <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center">
                      <Database className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                    <div className="absolute -right-2 -top-2">
                      <Sparkles className="h-5 w-5 text-amber-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mt-4">
                    {lang === 'sw' ? 'Hakuna matokeo' : 'No results found'}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md text-center mt-1">
                    {lang === 'sw'
                      ? 'Jaribu kubadilisha vichujio, maneno ya utafutaji, au uliza AI kwa msaada.'
                      : 'Try adjusting your filters, search terms, or ask AI for help.'}
                  </p>
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 bg-secondary text-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors"
                    >
                      {lang === 'sw' ? 'Futa vichujio vyote' : 'Clear all filters'}
                    </button>
                    <button
                      onClick={() => setShowAIChat(true)}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                      <Brain className="h-4 w-4" />
                      {lang === 'sw' ? 'Uliza AI' : 'Ask AI'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* FILTER DRAWER */}
      {/* ============================================================ */}
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
