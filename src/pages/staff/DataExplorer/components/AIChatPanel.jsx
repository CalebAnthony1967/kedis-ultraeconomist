import React, { useState, useRef, useEffect } from 'react';
import { Brain, Send, Loader2, Sparkles, X, History, Trash2, MapPin, Target, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { runRAG } from '@/lib/ai/rag';
import { saveConversation } from '@/lib/ai/memory';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabase/client';

export default function AIChatPanel({
  currentFilters,
  results,
  onApplyFilters,
  onGenerateReport,
  lastClassification,
  setLastClassification,
  conversationId,
  setConversationId,
  conversations,
  loadConversationsList,
  saveStructuredTurn,
  className = '',
  lang: propLang,
}) {
  const { lang: contextLang } = useLanguage();
  const lang = propLang || contextLang;
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef(null);

  // Welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: lang === 'sw'
            ? '👋 Karibu! Ni AlphaEconomist. Uliza swali kuhusu data, au nipe amri kama "Nionyeshe viashiria katika Nairobi".'
            : '👋 Welcome! I\'m AlphaEconomist. Ask a question about the data, or give me a command like "Show me indicators in Nairobi".',
        },
      ]);
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setIsStreaming(true);
    setStreamingContent('');

    // Show toast that AI is processing
    toast({
      title: lang === 'sw' ? 'AI inachambua...' : 'AI is analyzing...',
      description: lang === 'sw' ? 'Inatafuta kwenye hifadhi ya data' : 'Searching the sovereign data pool',
      duration: 2000,
    });

    try {
      // Create conversation if needed
      let convId = conversationId;
      if (!convId) {
        const title = input.substring(0, 60) + (input.length > 60 ? '...' : '');
        const saved = await saveConversation(null, [], title, lang || 'en', 'Data Explorer');
        convId = saved.id;
        setConversationId(convId);
        if (loadConversationsList) {
          loadConversationsList();
        }
      }

      // Run RAG with streaming
      const result = await runRAG(input, messages, {
        conversationId: convId,
        filterContext: currentFilters,
        classification: lastClassification,
        onChunk: (chunk) => {
          setStreamingContent(prev => prev + chunk);
        },
        maxTokens: 800,
        temperature: 0.7,
      });

      // Store classification for follow-ups
      if (result.classification && setLastClassification) {
        setLastClassification(result.classification);
      }

      // Save structured turn
      if (convId && saveStructuredTurn) {
        await saveStructuredTurn({
          query: input,
          classification: result.classification,
          answer: result.answer,
          spiCitations: result.citations || [],
          retrievedIndicatorIds: result.data?.map(d => d.id) || [],
          analytics: result.analytics || null,
        });
      }

      // Finalize message
      const assistantMsg = {
        role: 'assistant',
        content: result.answer,
        citations: result.citations || [],
        provider: result.provider || 'groq',
        classification: result.classification,
        confidence: result.confidence || 0.8,
        missing_entities: result.missing_entities || [],
        geography: result.classification?.geography,
        intent: result.classification?.intent,
      };
      setMessages(prev => [...prev, assistantMsg]);
      setStreamingContent('');
      setIsStreaming(false);

      // Show confidence toast
      if (result.confidence < 0.5) {
        toast({
          title: lang === 'sw' ? 'Uaminifu wa chini' : 'Low confidence',
          description: lang === 'sw'
            ? `Viashiria vinavyokosekana: ${result.missing_entities?.join(', ') || 'Haijulikani'}`
            : `Missing indicators: ${result.missing_entities?.join(', ') || 'Unknown'}`,
          variant: 'warning',
          duration: 4000,
        });
      }

      // Show data found toast
      if (result.data?.length > 0) {
        toast({
          title: lang === 'sw' ? 'Data imepatikana' : 'Data found',
          description: `${result.data.length} ${lang === 'sw' ? 'viashiria' : 'indicators'} ${lang === 'sw' ? 'vimepatikana' : 'found'}`,
          duration: 2000,
        });
      } else {
        toast({
          title: lang === 'sw' ? 'Hakuna data' : 'No data found',
          description: lang === 'sw'
            ? 'Jaribu kubadilisha maneno au vichujio'
            : 'Try adjusting your search terms or filters',
          variant: 'warning',
          duration: 3000,
        });
      }

      if (loadConversationsList) {
        loadConversationsList();
      }

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: lang === 'sw'
          ? 'Samahani, hitilafu imetokea. Tafadhali jaribu tena.'
          : 'Sorry, an error occurred. Please try again.',
      }]);
      toast({
        title: lang === 'sw' ? 'Hitilafu' : 'Error',
        description: error.message,
        variant: 'destructive',
        duration: 4000,
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewConversation = () => {
    setMessages([
      {
        role: 'assistant',
        content: lang === 'sw'
          ? '👋 Mazungumzo mapya! Ni AlphaEconomist. Uliza swali lako.'
          : '👋 New conversation! I\'m AlphaEconomist. Ask your question.',
      },
    ]);
    if (setConversationId) {
      setConversationId(null);
    }
    if (setLastClassification) {
      setLastClassification(null);
    }
    setInput('');
    setShowHistory(false);
    toast({
      title: lang === 'sw' ? 'Mazungumzo mapya' : 'New conversation',
      description: lang === 'sw' ? 'Muktadha umeondolewa' : 'Context has been cleared',
      duration: 2000,
    });
  };

  // Get the latest message for confidence display
  const getLatestConfidence = () => {
    const lastMsg = messages[messages.length - 1];
    return lastMsg?.confidence || null;
  };

  const latestConfidence = getLatestConfidence();

  // Render message with rich formatting
  const renderMessage = (content, citations = [], classification = null, confidence = null, missingEntities = []) => {
    let formatted = content;

    // Bold
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Lists
    formatted = formatted.replace(/^• /gm, '• ');

    // Citations
    if (citations && citations.length > 0) {
      formatted += `\n\n📚 **SPI Sources:** ${citations.map(c => `\`${c}\``).join(', ')}`;
    }

    return formatted;
  };

  return (
    <div className={`rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm flex flex-col h-80 ${className}`}>
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border/50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-primary">
            <Brain className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-xs font-semibold text-foreground">AlphaEconomist</span>
          <span className="text-[10px] text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded-full">
            AI Assistant
          </span>
          {/* Confidence badge - using latestConfidence */}
          {latestConfidence !== null && latestConfidence !== undefined && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border flex items-center gap-1
              ${latestConfidence >= 0.7 ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                latestConfidence >= 0.4 ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                'bg-red-500/10 text-red-600 border-red-500/20'
              }`}
            >
              <CheckCircle2 className="h-2.5 w-2.5" />
              {Math.round(latestConfidence * 100)}%
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="p-1 rounded-lg hover:bg-secondary/50 transition-colors"
            title={lang === 'sw' ? 'Historia' : 'History'}
          >
            <History className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button
            onClick={handleNewConversation}
            className="p-1 rounded-lg hover:bg-secondary/50 transition-colors"
            title={lang === 'sw' ? 'Mazungumzo mapya' : 'New conversation'}
          >
            <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Geography & Intent Badges (when detected) */}
      {(lastClassification?.geography?.name || lastClassification?.intent) && (
        <div className="px-4 py-1.5 border-b border-border/50 bg-secondary/10 flex flex-wrap items-center gap-2">
          {lastClassification?.geography?.name && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {lastClassification.geography.name}
            </span>
          )}
          {lastClassification?.intent && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border flex items-center gap-1
              ${lastClassification.intent === 'listing' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                lastClassification.intent === 'trend' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                lastClassification.intent === 'comparison' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                'bg-secondary text-muted-foreground'
              }`}
            >
              <Target className="h-2.5 w-2.5" />
              {lastClassification.intent}
            </span>
          )}
          {lastClassification?.missing_entities && lastClassification.missing_entities.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center gap-1">
              <AlertCircle className="h-2.5 w-2.5" />
              {lastClassification.missing_entities.length} missing
            </span>
          )}
        </div>
      )}

      {/* History Panel */}
      {showHistory && (
        <div className="border-b border-border/50 bg-secondary/20 max-h-40 overflow-y-auto shrink-0">
          <div className="p-2 space-y-1">
            <div className="flex items-center justify-between px-2 py-1 text-xs font-semibold text-muted-foreground">
              <span>{lang === 'sw' ? 'Mazungumzo' : 'Conversations'}</span>
              <button onClick={() => setShowHistory(false)}>
                <X className="h-3 w-3" />
              </button>
            </div>
            {conversations?.length === 0 ? (
              <p className="text-xs text-muted-foreground px-2 py-4 text-center">
                {lang === 'sw' ? 'Hakuna mazungumzo' : 'No conversations'}
              </p>
            ) : (
              conversations?.map((conv) => (
                <div
                  key={conv.id}
                  className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors
                    ${conversationId === conv.id ? 'bg-primary/10' : ''}
                  `}
                >
                  <span
                    onClick={() => {
                      setMessages(conv.messages || []);
                      setConversationId(conv.id);
                      setShowHistory(false);
                    }}
                    className="text-xs text-foreground truncate flex-1"
                  >
                    {conv.title || `Conversation ${new Date(conv.updated_at).toLocaleDateString()}`}
                  </span>
                  <button
                    onClick={async () => {
                      try {
                        await supabase.from('copilot_conversations').delete().eq('id', conv.id);
                        if (loadConversationsList) {
                          loadConversationsList();
                        }
                      } catch (e) {
                        console.warn('Delete failed:', e);
                      }
                    }}
                    className="p-0.5 rounded hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-xs whitespace-pre-wrap
                ${msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-foreground'
                }`}
            >
              <div
                dangerouslySetInnerHTML={{
                  __html: renderMessage(
                    msg.content,
                    msg.citations,
                    msg.classification,
                    msg.confidence,
                    msg.missing_entities
                  ),
                }}
              />
              {msg.provider && (
                <div className="mt-1 text-[8px] opacity-50">
                  via {msg.provider}
                </div>
              )}
            </div>
          </div>
        ))}

        {isStreaming && streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-lg px-3 py-2 text-xs bg-secondary/50 text-foreground">
              <div dangerouslySetInnerHTML={{ __html: streamingContent }} />
              <span className="inline-block w-1.5 h-3 bg-primary animate-pulse ml-0.5" />
            </div>
          </div>
        )}

        {isLoading && !streamingContent && (
          <div className="flex justify-start">
            <div className="bg-secondary/50 rounded-lg px-3 py-2 text-xs flex items-center gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span className="text-muted-foreground">
                {lang === 'sw' ? 'Inatafuta...' : 'Searching...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-2 border-t border-border/50 shrink-0 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={lang === 'sw' ? 'Uliza swali...' : 'Ask a question...'}
          className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-primary"
          disabled={isLoading}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50 transition-colors hover:bg-primary/90"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
