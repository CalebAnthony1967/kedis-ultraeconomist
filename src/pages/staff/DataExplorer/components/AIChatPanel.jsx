import React, { useState, useRef, useEffect } from 'react';
import { Brain, Send, Loader2, Sparkles, X } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

export default function AIChatPanel({
  currentFilters,
  results,
  onApplyFilters,
  onGenerateReport,
  className = '',
}) {
  const { lang } = useLanguage();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: lang === 'sw' 
        ? 'Karibu! Uliza swali kuhusu data hii, na AlphaEconomist atakusaidia.'
        : 'Welcome! Ask a question about this data, and AlphaEconomist will help.',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Simulate AI response
      await new Promise(r => setTimeout(r, 1500));

      const response = generateResponse(input, currentFilters, results, lang);
      const assistantMsg = { role: 'assistant', content: response };
      setMessages(prev => [...prev, assistantMsg]);

      // Check for filter actions
      if (response.includes('filter:')) {
        // Extract filter and apply
        const filterMatch = response.match(/filter:\s*({[^}]+})/);
        if (filterMatch) {
          try {
            const filters = JSON.parse(filterMatch[1]);
            onApplyFilters(filters);
          } catch (e) {}
        }
      }

      // Check for report request
      if (response.includes('report:true') && onGenerateReport) {
        onGenerateReport();
      }

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: lang === 'sw'
          ? 'Samahani, hitilafu imetokea. Tafadhali jaribu tena.'
          : 'Sorry, an error occurred. Please try again.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateResponse = (query, filters, data, lang) => {
    const lower = query.toLowerCase();
    
    // Report request
    if (lower.includes('report') || lower.includes('ripoti')) {
      return lang === 'sw'
        ? '✅ Ninaandaa ripoti. Tafadhali subiri...\n\nreport:true'
        : '✅ Generating report. Please wait...\n\nreport:true';
    }

    // Filter request
    if (lower.includes('show') || lower.includes('filter') || lower.includes('only')) {
      const indicators = data.map(d => d.name).slice(0, 5).join(', ');
      return lang === 'sw'
        ? `🔍 Nimepata data kuhusu:\n${indicators}\n\n${data.length > 0 ? `Tafadhali angalia matokeo ${data.length} yaliyopatikana.` : 'Hakuna data inayolingana. Jaribu kubadilisha vichujio.'}`
        : `🔍 I found data about:\n${indicators}\n\n${data.length > 0 ? `Check the ${data.length} results below.` : 'No data matches your criteria. Try adjusting filters.'}`;
    }

    // Insight request
    if (lower.includes('trend') || lower.includes('insight') || lower.includes('analysis')) {
      const values = data.map(d => d.value).filter(v => v !== null && v !== undefined);
      if (values.length > 1) {
        const first = values[0];
        const last = values[values.length - 1];
        const change = ((last - first) / (first || 1)) * 100;
        return lang === 'sw'
          ? `📊 Uchambuzi wa data:\n• Mabadiliko: ${change > 0 ? '+' : ''}${change.toFixed(1)}%\n• Thamani za juu zaidi: ${Math.max(...values).toFixed(2)}\n• Thamani za chini: ${Math.min(...values).toFixed(2)}\n\n${data.length > 0 ? `Tazama viashiria ${data.length} vilivyopatikana.` : ''}`
          : `📊 Data analysis:\n• Change: ${change > 0 ? '+' : ''}${change.toFixed(1)}%\n• Highest: ${Math.max(...values).toFixed(2)}\n• Lowest: ${Math.min(...values).toFixed(2)}\n\n${data.length > 0 ? `View ${data.length} indicators below.` : ''}`;
      }
    }

    // Default response
    if (data.length > 0) {
      return lang === 'sw'
        ? `📋 Nimepata data ${data.length} inayolingana na swali lako. Unaweza kuchagua kati ya mtazamo wa kadi, jedwali, au chati.\n\nTafadhali chagua kiashiria ili kuona maelezo zaidi.`
        : `📋 I found ${data.length} indicators matching your query. You can view them as cards, table, or chart.\n\nSelect an indicator to see more details.`;
    } else {
      return lang === 'sw'
        ? `❌ Hakuna data inayolingana na swali lako. Jaribu kubadilisha maneno au kuchagua vichujio tofauti.`
        : `❌ No data matches your query. Try rephrasing or adjusting your filters.`;
    }
  };

  return (
    <div className={`rounded-xl border border-border bg-card flex flex-col h-80 ${className}`}>
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-primary">
            <Brain className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-xs font-semibold text-foreground">AlphaEconomist</span>
          <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded-full">
            AI Assistant
          </span>
        </div>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <Sparkles className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
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
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
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
      <div className="p-2 border-t border-border flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
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
