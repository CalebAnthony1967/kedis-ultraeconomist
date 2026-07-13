import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '@/lib/i18n';
// Custom toast logic replaces the default component
import { TooltipProvider } from '@/components/ui/tooltip';
import { supabase } from '@/lib/supabaseClient';
import { runRAG, saveConversation, loadConversations, saveStructuredTurn } from '@/lib/huggingfaceLLM';
import DatasetSelector from '@/components/staff/DatasetSelector';
import CopilotMessage from '@/components/staff/CopilotMessage';
import { Brain, Send, Sparkles, Mic, Loader2, MessageSquare, Plus, History, X } from 'lucide-react';

const SUGGESTED_QUERIES = {
  en: [
    'What is the probability of Kenya achieving Vision 2030 10% GDP growth target?',
    'Compare maize yield trends across counties from 2018-2024.',
    'How does fertilizer subsidy affect agricultural GVA?',
    'What is the JSS Gender Parity index and is it on track?',
  ],
  sw: [
    'Je, uwezekano wa Kenya kufikia malengo ya Vision 2030 ya ukuaji wa 10% wa GDP ni upi?',
    'Linganisha mwenendo wa mavuno ya mahindi katika kaunti kutoka 2018-2024.',
    'Je, ruzuku ya mbolea inaathiri GVA ya kilimo vipi?',
    'Je, faharasa ya Usawa wa Jinsia ya JSS ni ipi na iko kwenye njia sahihi?',
  ],
};

export default function AlphaEconomistCopilot() {
  const { lang, t } = useLanguage();

  // --- Custom Toast Logic ---
  const [toasts, setToasts] = useState([]);
  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(({ title, description, variant, duration = 4000 }) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, title, description, variant }]);
    setTimeout(() => removeToast(id), duration);
  }, [removeToast]);
  // ---------------------------

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);

  // Dataset state
  const [jobs, setJobs] = useState([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState({ type: 'all', label: 'All Sovereign Data' });
  const [indicatorCounts, setIndicatorCounts] = useState({ total: 0 });

  // Conversation state
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // -------------------------------------------------------------------------
  // Load datasets and indicator counts
  // -------------------------------------------------------------------------
  const loadJobs = useCallback(async () => {
    setIsLoadingJobs(true);
    try {
      const { data, error } = await supabase
        .from('data_ingestion_jobs')
        .select('id, file_name, file_type, source_mcda, status, records_ingested, fair_score, temporal_year, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setJobs(data || []);

      // Get indicator counts per source
      const { data: countData, error: countError } = await supabase
        .from('indicators')
        .select('source_mcda');
      if (!countError && countData) {
        const counts = { total: countData.length };
        countData.forEach(item => {
          const src = item.source_mcda || 'Unknown';
          counts[src] = (counts[src] || 0) + 1;
        });
        setIndicatorCounts(counts);
      }
    } catch (e) {
      toast({ title: 'Failed to load datasets', description: e.message, variant: 'destructive' });
    } finally {
      setIsLoadingJobs(false);
    }
  }, [toast]);

  const loadConversationsList = useCallback(async () => {
    try {
      const list = await loadConversations(15);
      setConversations(list);
    } catch (e) {
      // RLS may block — fail silently
    }
  }, []);

  useEffect(() => {
    loadJobs();
    loadConversationsList();
  }, [loadJobs, loadConversationsList]);

  // -------------------------------------------------------------------------
  // Send message with RAG (full workflow)
  // -------------------------------------------------------------------------
  const handleSend = async (query) => {
    const text = (query || input).trim();
    if (!text || loading) return;

    const userMsg = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // 1. Ensure we have a conversation ID before calling runRAG
      let currentConversationId = conversationId;
      if (!currentConversationId) {
        // Create a new conversation with placeholder title
        const title = text.substring(0, 60) + (text.length > 60 ? '...' : '');
        const { id } = await saveConversation(null, [], title, lang, selectedFilter.label);
        currentConversationId = id;
        setConversationId(id);
        loadConversationsList();
      }

      // 2. Call runRAG with the conversation ID so it auto-saves structured turns
      const result = await runRAG(text, selectedFilter, lang, messages, currentConversationId);

      // 3. Build assistant message with additional metadata
      const aiMsg = {
        role: 'assistant',
        content: result.answer || 'I could not process that query.',
        spi_citations: result.spi_citations || [],
        probability_score: result.probability_score,
        context_count: result.context_count || 0,
        retrieved_indicators: result.retrieved_indicators || [],
        confidence: result.confidence,
        missing_entities: result.missing_entities || [],
        classification: result.classification,
        analytics: result.analytics,
      };
      const updatedMessages = [...newMessages, aiMsg];
      setMessages(updatedMessages);

      // 4. Show warning if confidence is low
      if (result.confidence !== undefined && result.confidence < 0.5) {
        toast({
          title: 'Low data confidence',
          description: `Some requested indicators are missing: ${result.missing_entities?.join(', ') || 'Unknown'}`,
          variant: 'warning',
          duration: 5000,
        });
      }

      if (result.context_count === 0) {
        toast({
          title: 'No data found in pool',
          description: 'Try selecting a different dataset or upload more data via ETL',
          variant: 'warning',
        });
      }

      // 5. Update conversation list to reflect new message
      loadConversationsList();

    } catch (e) {
      const errMsg = {
        role: 'assistant',
        content: lang === 'sw'
          ? `Samahani, hitilafu imetokea: ${e.message}`
          : `An error occurred: ${e.message}`,
        spi_citations: [],
        context_count: 0,
      };
      setMessages(prev => [...prev, errMsg]);
      toast({
        title: 'AI query failed',
        description: e.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // Voice input (Web Speech API)
  // -------------------------------------------------------------------------
  const handleVoice = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: 'Voice input not supported', description: 'Use Chrome or Edge browser', variant: 'destructive' });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'sw' ? 'sw-KE' : 'en-KE';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setListening(false);
    };
    recognition.onerror = () => {
      setListening(false);
      toast({ title: 'Voice recognition failed', variant: 'destructive' });
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  // -------------------------------------------------------------------------
  // New conversation
  // -------------------------------------------------------------------------
  const handleNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    setInput('');
    setShowHistory(false);
    toast({ title: 'New chat started', description: 'Context has been cleared' });
  };

  const handleLoadConversation = async (conv) => {
    try {
      const { data, error } = await supabase
        .from('copilot_conversations')
        .select('*')
        .eq('id', conv.id)
        .single();
      if (error) throw error;
      setMessages(data.messages || []);
      setConversationId(data.id);
      setShowHistory(false);
      toast({ title: 'Conversation loaded' });
    } catch (e) {
      toast({ title: 'Failed to load conversation', variant: 'destructive' });
    }
  };

  const handleRouteToPS = (message) => {
    toast({
      title: 'Routed to Principal Secretary',
      description: 'Insight has been forwarded for policy review',
    });
  };

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <TooltipProvider>
      {/* Fleeting Toasts - Top Right */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col items-end gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`
              pointer-events-auto min-w-[320px] max-w-md p-4 rounded-xl shadow-2xl text-white flex items-start gap-3
              transform transition-all duration-500 animate-in slide-in-from-right-full fade-in
              ${t.variant === 'destructive' ? 'bg-red-600' : t.variant === 'warning' ? 'bg-orange-500' : 'bg-emerald-600'}
            `}
          >
            <div className="flex-1">
              {t.title && <div className="font-bold text-sm tracking-tight">{t.title}</div>}
              {t.description && <div className="text-xs opacity-90 mt-1 leading-normal font-medium">{t.description}</div>}
            </div>
            <button onClick={() => removeToast(t.id)} className="shrink-0 opacity-70 hover:opacity-100 transition-opacity">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="border-b border-border bg-card px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-primary">
                <Brain className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-display text-lg font-bold text-foreground">{t('staff.copilot')}</h1>
                <p className="text-xs text-muted-foreground">
                  Dataset Retrieved · SPI-cited · {selectedFilter?.label} · {lang === 'sw' ? 'Swahili' : 'English'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary transition-colors"
              >
                <History className="h-3.5 w-3.5" />
                History
              </button>
              <button
                onClick={handleNewConversation}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                New
              </button>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <Sparkles className="h-3.5 w-3.5" />
                Agent Active
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Dataset Selector Sidebar */}
          <div className="hidden lg:block w-72 border-r border-border shrink-0">
            <DatasetSelector
              jobs={jobs}
              selectedFilter={selectedFilter}
              onSelectFilter={(filter) => {
                setSelectedFilter(filter);
                toast({ title: 'Dataset selected', description: filter.label });
              }}
              isLoading={isLoadingJobs}
              onRefresh={loadJobs}
              indicatorCounts={indicatorCounts}
            />
          </div>

          {/* Chat area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* History panel */}
            {showHistory && (
              <div className="border-b border-border bg-card max-h-64 overflow-y-auto scrollbar-thin">
                <div className="px-4 py-2 flex items-center justify-between border-b border-border">
                  <span className="text-xs font-semibold flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Conversation History
                  </span>
                  <button onClick={() => setShowHistory(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                {conversations.length === 0 ? (
                  <p className="px-4 py-6 text-center text-xs text-muted-foreground">No saved conversations</p>
                ) : (
                  conversations.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => handleLoadConversation(conv)}
                      className={`w-full px-4 py-2.5 text-left border-b border-border/50 hover:bg-secondary/30 transition-colors
                        ${conversationId === conv.id ? 'bg-primary/5' : ''}`}
                    >
                      <p className="text-xs font-medium text-foreground truncate">{conv.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {conv.sector} · {new Date(conv.updated_at).toLocaleDateString()}
                        {conv.structured_context && (
                          <span className="ml-2 text-primary">· structured</span>
                        )}
                      </p>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto scrollbar-thin px-4 lg:px-8 py-6">
              <div className="max-w-4xl mx-auto">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                      <Brain className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="font-display text-xl font-bold text-foreground">AlphaEconomist Copilot</h2>
                    <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                      {lang === 'sw'
                        ? 'Uliza maswali kuhusu sera za kiuchumi. Majibu yote yatatumia data iliyothibitishwa kutoka kwenye hifadhi ya taifa na kutaja vyanzo vya SPI.'
                        : 'Ask questions about economic policy. All answers use verified data from the sovereign pool and cite SPI sources.'}
                    </p>
                    <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                      <Sparkles className="h-3 w-3" />
                      Searching: {selectedFilter?.label}
                    </div>
                    <div className="mt-8 grid sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
                      {SUGGESTED_QUERIES[lang].map((q, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(q)}
                          className="text-left rounded-xl border border-border bg-card p-4 text-sm text-foreground/80 hover:border-primary hover:bg-primary/5 transition-all"
                        >
                          <Sparkles className="h-4 w-4 text-primary mb-2" />
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages.map((msg, i) => (
                      <CopilotMessage
                        key={i}
                        message={msg}
                        onRouteToPS={handleRouteToPS}
                        showConfidence={msg.role === 'assistant'}
                      />
                    ))}
                    {loading && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span>AlphaEconomist is querying the sovereign data pool...</span>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-border bg-card px-4 lg:px-8 py-4">
              <div className="max-w-4xl mx-auto flex items-center gap-2">
                <button
                  onClick={handleVoice}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors
                    ${listening ? 'border-primary bg-primary/10 text-primary animate-pulse' : 'border-border text-muted-foreground hover:bg-secondary'}`}
                >
                  <Mic className="h-4 w-4" />
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={lang === 'sw' ? 'Uliza swali kuhusu sera...' : 'Ask a policy question...'}
                  className="flex-1 rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || loading}
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-50 transition-all hover:shadow-lg"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              {listening && (
                <p className="mt-2 text-xs text-center text-primary animate-pulse">
                  {lang === 'sw' ? 'Inasikiliza...' : 'Listening...'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
