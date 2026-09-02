import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/lib/i18n';
import { useExplorerData } from './hooks/useExplorerData';
import { useToast } from '@/components/ui/use-toast';
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
  ChevronDown,
  Share2,
  Link2,
  Zap,
  Target,
  CheckCircle2,
  AlertCircle,
  Menu,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================
// HELPER: Group indicators by name, show latest year
// ============================================================

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
      if (indicator.year && !grouped[key].years.includes(indicator.year)) {
        grouped[key].years.push(indicator.year);
        grouped[key].values.push({ year: indicator.year, value: indicator.value });
      }
      if (indicator.year > grouped[key].year) {
        grouped[key].year = indicator.year;
        grouped[key].value = indicator.value;
      }
      if (indicator.year) {
        const years = grouped[key].years;
        grouped[key].year_range = `${Math.min(...years)} – ${Math.max(...years)}`;
      }
    }
  }
  
  for (const key of Object.keys(grouped)) {
    grouped[key].years.sort((a, b) => a - b);
    grouped[key].values.sort((a, b) => a.year - b.year);
  }
  
  return Object.values(grouped);
}

function getDisplayIndicators(indicators) {
  if (!indicators || indicators.length === 0) return [];
  if (indicators[0]?.values) {
    return indicators;
  }
  return groupIndicatorsByLatestYear(indicators);
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function DataExplorer() {
  const { lang } = useLanguage();
  const { toast } = useToast();
  
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
  } = useExplorerData();

  // State
  const [viewMode, setViewMode] = useState('card');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedIndicatorId, setSelectedIndicatorId] = useState(null);
  const [selectedEntityLevel, setSelectedEntityLevel] = useState('all');
  const [showAIChat, setShowAIChat] = useState(false); // Default closed on mobile
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInsights, setShowInsights] = useState(false); // Default closed on mobile
  const [aiQuery, setAiQuery] = useState('');
  const [favourites, setFavourites] = useState([]);
  const [aiInsights, setAiInsights] = useState([]);
  const [isAISearching, setIsAISearching] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const recognitionRef = useRef(null);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showMobileSidebar && !e.target.closest('.mobile-sidebar') && !e.target.closest('.menu-button')) {
        setShowMobileSidebar(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showMobileSidebar]);

  // Grouped indicators for display
  const displayIndicators = getDisplayIndicators(results);
  const entityCounts = getEntityLevelCounts(results);

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

  const handleAISearch = async (query) => {
    if (!query || query.trim().length === 0) return;
    
    setAiQuery(query);
    setIsAISearching(true);
    
    toast({
      title: lang === 'sw' ? 'AI inachambua...' : 'AI is analyzing...',
      description: lang === 'sw' ? 'Inatafuta kwenye hifadhi ya data' : 'Searching the sovereign data pool',
      duration: 2000,
    });
    
    try {
      const classification = await classifyUserQuery(query);
      
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
        
        if (classification.geography?.type === 'county') {
          setSelectedEntityLevel('County');
          toast({
            title: lang === 'sw' ? `Eneo limegunduliwa: ${classification.geography.name}` : `Geography detected: ${classification.geography.name}`,
            description: lang === 'sw' ? 'Vichujio vimewekwa kiotomatiki' : 'Filters have been auto-applied',
            duration: 3000,
          });
        }
        
        search(newFilters);
      } else {
        handleSearch(query);
      }
    } catch (error) {
      console.error('AI search failed:', error);
      handleSearch(query);
    } finally {
      setIsAISearching(false);
    }
  };

  const handleSortChange = (sortBy) => {
    updateFilter('sortBy', sortBy);
  };

  const handlePageSizeChange = (limit) => {
    setPageSize(limit);
  };

  const handleViewIndicator = (indicator) => {
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
    setAiInsights(newInsights);
  };

  const toggleVoiceInput = () => {
    if (isVoiceListening) {
      recognitionRef.current?.stop();
      setIsVoiceListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: lang === 'sw' ? 'Sauti haitumiki' : 'Voice not supported',
        description: lang === 'sw' ? 'Tumia Chrome au Edge' : 'Use Chrome or Edge browser',
        variant: 'destructive',
      });
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
      toast({
        title: lang === 'sw' ? 'Hitilafu ya sauti' : 'Voice error',
        variant: 'destructive',
      });
    };

    recognition.onend = () => setIsVoiceListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsVoiceListening(true);
  };

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
        toast({
          title: lang === 'sw' ? 'URL imenakiliwa!' : 'URL copied!',
          description: lang === 'sw' ? 'Shiriki na wengine' : 'Share with others',
          duration: 2000,
        });
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
      {/* HEADER - MOBILE OPTIMIZED */}
      {/* ============================================================ */}
      <div className="sticky top-0 z-20 backdrop-blur-xl bg-white/70 dark:bg-slate-950/70 border-b border-border/50 px-3 sm:px-4 lg:px-8 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Logo & Title */}
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              {/* Menu Button - Mobile Only */}
              <button
                onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                className="lg:hidden p-1.5 rounded-lg hover:bg-secondary/50 transition-colors menu-button"
                aria-label="Toggle menu"
              >
                <Menu className="h-5 w-5 text-foreground" />
              </button>

              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 shadow-lg shadow-primary/20 flex-shrink-0">
                <Database className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              
              <div className="min-w-0">
                <h1 className="font-display text-sm sm:text-xl font-bold text-foreground flex items-center gap-1 sm:gap-2">
                  <span className="bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent truncate">
                    {isMobile ? (
                      lang === 'sw' ? 'Kichunguzi' : 'Explorer'
                    ) : (
                      lang === 'sw' ? 'Kichunguzi Data' : 'Data Explorer'
                    )}
                  </span>
                  <span className="text-[8px] sm:text-xs font-normal bg-primary/10 text-primary px-1.5 sm:px-2 py-0.5 rounded-full border border-primary/20 flex-shrink-0">
                    Beta
                  </span>
                </h1>
                {!isMobile && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block truncate">
                    {lang === 'sw' 
                      ? 'Gundua, elewa, na pakua data'
                      : 'Discover, visualise, and download data'}
                  </p>
                )}
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
              {/* AI Status - Hidden on very small screens */}
              <div className="hidden md:flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-emerald-500/10 border border-primary/20">
                <Brain className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-primary animate-pulse" />
                <span className="text-[9px] sm:text-xs font-medium text-primary hidden sm:inline">
                  AI
                </span>
                <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500"></span>
                </span>
              </div>

              {/* AI Confidence - Mobile Friendly */}
              {aiConfidence > 0 && !isMobile && (
                <span className={`text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full border flex items-center gap-1
                  ${getConfidenceColor(aiConfidence)}
                `}>
                  <CheckCircle2 className="h-2 w-2 sm:h-3 sm:w-3" />
                  <span className="hidden xs:inline">{Math.round(aiConfidence * 100)}%</span>
                </span>
              )}

              {/* Share Button - Hidden on mobile */}
              <button
                onClick={handleShare}
                className="hidden sm:inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-border/50 text-[10px] sm:text-xs font-medium hover:bg-secondary/50 transition-colors"
              >
                <Share2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">{lang === 'sw' ? 'Shiriki' : 'Share'}</span>
              </button>

              {/* Total Counter - Mobile Friendly */}
              <div className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-secondary/50 px-2 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-xs font-semibold text-foreground border border-border/50">
                <Database className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-primary" />
                <span className="hidden xs:inline">
                  {displayIndicators.length}
                </span>
                <span className="text-[8px] sm:text-[10px] text-muted-foreground">
                  ({results.length})
                </span>
              </div>
            </div>
          </div>

          {/* Entity Level Filter - Mobile Optimized */}
          <div className="mt-2 sm:mt-3 overflow-x-auto">
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
              isMobile={isMobile}
            />
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MAIN CONTENT */}
      {/* ============================================================ */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT SIDEBAR - Desktop */}
        <div className="hidden lg:block w-64 xl:w-72 border-r border-border/50 bg-card/30 backdrop-blur-sm overflow-y-auto flex-shrink-0">
          <div className="p-3 xl:p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                <Globe className="h-3.5 w-3.5 text-primary" />
              </div>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                {lang === 'sw' ? 'Vikoa' : 'Domains'}
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

        {/* MOBILE SIDEBAR - Overlay */}
        <AnimatePresence>
          {showMobileSidebar && isMobile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setShowMobileSidebar(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showMobileSidebar && isMobile && (
            <motion.div
              initial={{ x: -280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -280, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="mobile-sidebar fixed left-0 top-0 z-50 h-full w-72 bg-card/95 backdrop-blur-xl border-r border-border/50 shadow-2xl lg:hidden overflow-y-auto"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                      <Globe className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {lang === 'sw' ? 'Vikoa' : 'Domains'}
                    </span>
                  </div>
                  <button
                    onClick={() => setShowMobileSidebar(false)}
                    className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <DomainTree
                  data={domainTree}
                  selectedSubdomainId={filters.subdomainIds?.[0]}
                  onSelectSubdomain={(subdomainId) => {
                    updateFilter('subdomainIds', [subdomainId]);
                    setShowMobileSidebar(false);
                  }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ============================================================ */}
        {/* MAIN CONTENT AREA */}
        {/* ============================================================ */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Search & Controls Bar - Mobile Optimized */}
          <div className="bg-card/50 backdrop-blur-sm border-b border-border/50 px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
            <div className="max-w-full">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                <div className="flex-1 w-full">
                  <div className="relative">
                    <SearchBar
                      value={searchQuery}
                      onChange={(query) => setSearchQuery(query)}
                      onSearch={handleAISearch}
                      isLoading={isLoading || isAISearching}
                      placeholder={isMobile 
                        ? (lang === 'sw' ? 'Tafuta...' : 'Search...')
                        : (lang === 'sw' ? 'Tafuta viashiria au uliza AI...' : 'Search indicators or ask AI...')
                      }
                      suggestions={filterOptions.domains?.map(d => d.name) || []}
                      className="w-full"
                      isMobile={isMobile}
                    />
                    <button
                      onClick={toggleVoiceInput}
                      className={`absolute right-10 sm:right-12 top-1/2 -translate-y-1/2 p-1 sm:p-1.5 rounded-full transition-all
                        ${isVoiceListening 
                          ? 'text-red-500 bg-red-100 animate-pulse' 
                          : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                        }`}
                      title={lang === 'sw' ? 'Ingiza kwa sauti' : 'Voice input'}
                    >
                      {isVoiceListening ? (
                        <MicOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      ) : (
                        <Mic className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      )}
                    </button>
                    {isAISearching && (
                      <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2">
                        <div className="flex items-center gap-1">
                          <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin text-primary" />
                          <span className="text-[8px] sm:text-[10px] text-primary font-medium hidden xs:inline">
                            AI...
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons - Mobile Optimized */}
                <div className="flex items-center gap-1 sm:gap-2 shrink-0 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => setShowAIChat(!showAIChat)}
                    className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-medium transition-all
                      ${showAIChat 
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
                        : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                      }`}
                  >
                    <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">{lang === 'sw' ? 'Chat' : 'Chat'}</span>
                  </button>
                  <button
                    onClick={() => setShowInsights(!showInsights)}
                    className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-medium transition-all
                      ${showInsights 
                        ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' 
                        : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                      }`}
                  >
                    <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">{lang === 'sw' ? 'Uchambuzi' : 'Insights'}</span>
                  </button>
                  <button
                    onClick={() => setIsFilterOpen(true)}
                    className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-secondary/50 text-muted-foreground hover:bg-secondary text-[10px] sm:text-xs font-medium transition-all"
                  >
                    <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">{lang === 'sw' ? 'Vichujio' : 'Filters'}</span>
                  </button>
                </div>
              </div>

              {/* AI Query Display - Mobile Optimized */}
              {aiQuery && (
                <div className="mt-1.5 sm:mt-2 flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <div className="flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-primary/5 border border-primary/20">
                    <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary" />
                    <span className="text-[8px] sm:text-[10px] text-primary font-medium">
                      {lang === 'sw' ? 'AI' : 'AI'}
                    </span>
                  </div>
                  <span className="text-[10px] sm:text-xs text-muted-foreground italic truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">
                    "{aiQuery}"
                  </span>
                  <button
                    onClick={() => setAiQuery('')}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {detectedGeography?.name && (
                    <span className="text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
                      <MapPin className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                      <span className="hidden xs:inline">{detectedGeography.name}</span>
                    </span>
                  )}
                  {missingEntities && missingEntities.length > 0 && (
                    <span className="text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center gap-1">
                      <AlertCircle className="h-2 w-2 sm:h-2.5 sm:w-2.5" />
                      <span className="hidden xs:inline">{missingEntities.length}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ============================================================ */}
          {/* AI CHAT & INSIGHTS PANELS - Mobile Optimized */}
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 max-h-64 sm:max-h-80 overflow-y-auto">
                  {showAIChat && (
                    <AIChatPanel
                      currentFilters={filters}
                      results={results}
                      onApplyFilters={handleAIFilterApply}
                      onGenerateReport={() => console.log('Generate report')}
                      lastClassification={lastClassification}
                      setLastClassification={setLastClassification}
                      conversationId={conversationId}
                      setConversationId={setConversationId}
                      conversations={conversations}
                      loadConversationsList={loadConversationsList}
                      saveStructuredTurn={saveStructuredTurn}
                      className="min-h-[150px] sm:min-h-[200px]"
                      lang={lang}
                    />
                  )}
                  {showInsights && (
                    <InsightsPanel
                      data={displayIndicators}
                      citations={citations || []}
                      confidence={aiConfidence || 0.5}
                      missingEntities={missingEntities || []}
                      detectedGeography={detectedGeography}
                      detectedIntent={detectedIntent}
                      onGenerate={handleAIChatInsights}
                      className="min-h-[150px] sm:min-h-[200px]"
                      lang={lang}
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ============================================================ */}
          {/* CONTROL BAR - Mobile Optimized */}
          {/* ============================================================ */}
          <div className="bg-card/30 backdrop-blur-sm border-b border-border/50 px-2 sm:px-4 lg:px-6 py-1.5 sm:py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-1 sm:gap-2">
              {/* View Toggle - Mobile Friendly */}
              <div className="flex items-center gap-0.5 rounded-lg bg-secondary/30 p-0.5 border border-border/50">
                {viewModes.map((mode) => {
                  const Icon = mode.icon;
                  const isActive = viewMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setViewMode(mode.id)}
                      className={`px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-all flex items-center gap-0.5 sm:gap-1.5
                        ${isActive 
                          ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                        }`}
                    >
                      <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      <span className="hidden xs:inline">{isMobile ? mode.label.substring(0, 3) : mode.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Result Counter - Mobile Friendly */}
              <div className="text-[10px] sm:text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{displayIndicators.length}</span>
                <span className="hidden xs:inline">
                  {' '}{lang === 'sw' ? 'ya' : 'of'} {displayIndicators.length}
                </span>
                <span className="text-[8px] sm:text-[10px] text-muted-foreground/60 ml-1 sm:ml-2">
                  ({results.length})
                </span>
              </div>

              {/* Sort & Page Size - Mobile Optimized */}
              <div className="flex items-center gap-1 sm:gap-2">
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="h-6 sm:h-8 rounded-lg border border-input bg-background px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-xs outline-none focus:ring-1 focus:ring-primary max-w-[80px] sm:max-w-none"
                >
                  <option value="relevance">{isMobile ? 'Rel' : (lang === 'sw' ? 'Umuhimu' : 'Relevance')}</option>
                  <option value="name">{isMobile ? 'Jina' : (lang === 'sw' ? 'Jina' : 'Name')}</option>
                  <option value="year">{isMobile ? 'Mwaka' : (lang === 'sw' ? 'Mwaka' : 'Year')}</option>
                </select>
                <select
                  value={filters.limit}
                  onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                  className="h-6 sm:h-8 rounded-lg border border-input bg-background px-1.5 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-xs outline-none focus:ring-1 focus:ring-primary"
                >
                  {[20, 50, 100].map((size) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* RESULTS AREA - Mobile Optimized */}
          {/* ============================================================ */}
          <div className="flex-1 overflow-y-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-6">
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
              {/* Loading State */}
              {isLoading && !displayIndicators.length && (
                <div className="flex flex-col items-center justify-center py-12 sm:py-20">
                  <div className="relative">
                    <div className="h-10 w-10 sm:h-12 sm:w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Database className="h-4 w-4 sm:h-5 sm:w-5 text-primary/60" />
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4">
                    {lang === 'sw' ? 'Inapakia data...' : 'Loading data...'}
                  </p>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="flex flex-col items-center justify-center py-12 sm:py-20">
                  <div className="rounded-full bg-red-500/10 p-3 sm:p-4 mb-3 sm:mb-4">
                    <X className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
                  </div>
                  <p className="text-xs sm:text-sm text-red-500 font-medium">{error}</p>
                  <button
                    onClick={() => search()}
                    className="mt-3 sm:mt-4 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary text-primary-foreground rounded-lg text-xs sm:text-sm font-medium hover:bg-primary/90"
                  >
                    {lang === 'sw' ? 'Jaribu Tena' : 'Retry'}
                  </button>
                </div>
              )}

              {/* Results */}
              {!isLoading && !error && displayIndicators.length > 0 && (
                <>
                  {/* Card View - Mobile Optimized */}
                  {viewMode === 'card' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                      {displayIndicators.map((indicator) => (
                        <DataCard
                          key={indicator.indicator_id || indicator.id || indicator.name}
                          indicator={indicator}
                          onView={handleViewIndicator}
                          onDownload={handleDownload}
                          onFavourite={handleFavourite}
                          isFavourite={isFavourite(indicator)}
                          isMobile={isMobile}
                        />
                      ))}
                    </div>
                  )}

                  {/* Table View - Mobile Responsive */}
                  {viewMode === 'table' && (
                    <div className="overflow-x-auto -mx-2 sm:mx-0">
                      <TableView
                        data={displayIndicators}
                        onRowClick={handleViewIndicator}
                        lang={lang}
                        isMobile={isMobile}
                      />
                    </div>
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
                        height={isMobile ? 300 : 350}
                      />
                    </div>
                  )}

                  {/* Pagination - Mobile Optimized */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between gap-2 sm:gap-4 pt-3 sm:pt-4">
                      <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-border/50 text-[10px] sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary/50 transition-colors"
                      >
                        <span className="flex items-center gap-1 sm:gap-2">
                          <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 rotate-90" />
                          <span className="hidden xs:inline">{lang === 'sw' ? 'Iliyopita' : 'Previous'}</span>
                        </span>
                      </button>
                      <span className="text-[10px] sm:text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{currentPage}</span>
                        <span className="hidden xs:inline"> {lang === 'sw' ? 'ya' : 'of'} <span className="font-medium text-foreground">{totalPages}</span></span>
                      </span>
                      <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage >= totalPages}
                        className="px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-border/50 text-[10px] sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary/50 transition-colors"
                      >
                        <span className="flex items-center gap-1 sm:gap-2">
                          <span className="hidden xs:inline">{lang === 'sw' ? 'Ijayo' : 'Next'}</span>
                          <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 -rotate-90" />
                        </span>
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* Empty State - Mobile Optimized */}
              {!isLoading && !error && displayIndicators.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 sm:py-20">
                  <div className="relative">
                    <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/5 flex items-center justify-center">
                      <Database className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/30" />
                    </div>
                    <div className="absolute -right-2 -top-2">
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
                    </div>
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mt-3 sm:mt-4">
                    {lang === 'sw' ? 'Hakuna matokeo' : 'No results found'}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground max-w-md text-center mt-1 px-4">
                    {lang === 'sw'
                      ? 'Jaribu kubadilisha vichujio, maneno ya utafutaji, au uliza AI kwa msaada.'
                      : 'Try adjusting your filters, search terms, or ask AI for help.'}
                  </p>
                  <div className="flex flex-wrap gap-2 sm:gap-3 mt-3 sm:mt-4">
                    <button
                      onClick={clearFilters}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 bg-secondary text-foreground rounded-lg text-xs sm:text-sm font-medium hover:bg-secondary/80 transition-colors"
                    >
                      {lang === 'sw' ? 'Futa vichujio' : 'Clear filters'}
                    </button>
                    <button
                      onClick={() => setShowAIChat(true)}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary text-primary-foreground rounded-lg text-xs sm:text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-1 sm:gap-2"
                    >
                      <Brain className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
      {/* FILTER DRAWER - Mobile Optimized */}
      {/* ============================================================ */}
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filters={filters}
        filterOptions={filterOptions}
        onApplyFilters={handleApplyFilters}
        onClearFilters={clearFilters}
        isMobile={isMobile}
      />
    </div>
  );
}
