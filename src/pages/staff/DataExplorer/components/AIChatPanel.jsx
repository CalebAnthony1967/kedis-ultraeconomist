import React, { useState, useRef, useEffect } from 'react';
import { Brain, Send, Loader2, Sparkles, X, History, Trash2, Menu, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';
import { runRAG } from '@/lib/ai/rag';
import { saveConversation, loadConversations, deleteConversation } from '@/lib/ai/memory';

export default function AIChatPanel({
  currentFilters,
  results,
  onApplyFilters,
  onGenerateReport,
  className = '',
}) {
  const { lang } = useLanguage();
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversationList();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const loadConversationList = async () => {
    try {
      const list = await loadConversations(20);
      setConversations(list);
    } catch (e) {
      console.warn('Failed to load conversations:', e);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setIsStreaming(true);
    setStreamingContent('');

    try {
      // If no conversation exists, create one
      let convId = currentConversationId;
      if (!convId) {
        const title = input.substring(0, 60) + (input.length > 60 ? '...' : '');
        const saved = await saveConversation(null, [], title, lang || 'en', 'General');
        convId = saved.id;
        setCurrentConversationId(convId);
        loadConversationList();
      }

      // Run RAG with streaming
      const result = await runRAG(input, messages, {
        conversationId: convId,
        filterContext: currentFilters,
        onChunk: (chunk) => {
          setStreamingContent(prev => prev + chunk);
        },
        maxTokens: 800,
        temperature: 0.7,
      });

      // Finalize the assistant message
      const assistantMsg = {
        role: 'assistant',
        content: result.answer,
        citations: result.citations,
        provider: result.provider,
      };
      setMessages(prev => [...prev, assistantMsg]);
      setStreamingContent('');
      setIsStreaming(false);

      // Update conversation list
      loadConversationList();

      // Apply filters if AI suggests
      if (result.classification?.entities?.counties?.length > 0) {
        onApplyFilters?.({
          countyCodes: result.classification.entities.counties,
        });
      }

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: lang === 'sw'
          ? 'Samahani, hitilafu imetokea. Tafadhali jaribu tena.'
          : 'Sorry, an error occurred. Please try again.',
      }]);
      setIsStreaming(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadConversation = async (conv) => {
    try {
      setMessages(conv.messages || []);
      setCurrentConversationId(conv.id);
      setShowHistory(false);
    } catch (e) {
      console.warn('Failed to load conversation:', e);
    }
  };

  const handleDeleteConversation = async (convId) => {
    try {
      await deleteConversation(convId);
      await loadConversationList();
      if (currentConversationId === convId) {
        setMessages([]);
        setCurrentConversationId(null);
      }
    } catch (e) {
      console.warn('Failed to delete conversation:', e);
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setInput('');
    setShowHistory(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Render message with markdown-like formatting
  const renderMessage = (content, citations = []) => {
    // Simple formatting: bold, lists, code
    let formatted = content;
    
    // Bold
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Lists
    formatted = formatted.replace(/^• /gm, '• ');
    
    // Citations
    if (citations && citations.length > 0) {
      formatted += `\n\n📚 **Sources:** ${citations.map(c => `\`${c}\``).join(', ')}`;
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
            {conversations.length === 0 ? (
              <p className="text-xs text-muted-foreground px-2 py-4 text-center">
                {lang === 'sw' ? 'Hakuna mazungumzo' : 'No conversations'}
              </p>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`flex items-center justify-between px-2 py-1.5 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors
                    ${currentConversationId === conv.id ? 'bg-primary/10' : ''}
                  `}
                >
                  <span
                    onClick={() => handleLoadConversation(conv)}
                    className="text-xs text-foreground truncate flex-1"
                  >
                    {conv.title || `Conversation ${new Date(conv.updated_at).toLocaleDateString()}`}
                  </span>
                  <button
                    onClick={() => handleDeleteConversation(conv.id)}
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
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-2">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground max-w-[200px]">
              {lang === 'sw'
                ? 'Uliza swali kuhusu data hii'
                : 'Ask a question about this data'}
            </p>
          </div>
        )}

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
                  __html: renderMessage(msg.content, msg.citations),
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
