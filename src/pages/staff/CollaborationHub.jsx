import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Send, Calendar, Hash, Users, Brain,
  Plus, Clock, Globe2
} from 'lucide-react';

const CHANNELS = [
  { id: 'macro-infra', name: 'Macro ↔ Infrastructure', members: 12, lastMsg: 'Do road timelines match 2027 GDP projections?', time: '2m' },
  { id: 'social-health', name: 'Social ↔ Health', members: 8, lastMsg: 'Stunting data from KNBS verified ✓', time: '15m' },
  { id: 'trade-finance', name: 'Trade ↔ Finance', members: 6, lastMsg: 'Q4 trade deficit analysis ready for review', time: '1h' },
  { id: 'ict-legal', name: 'ICT ↔ Legal (KDPA)', members: 5, lastMsg: 'Anonymization toggle updated for citizen data', time: '3h' },
];

const CALENDAR_EVENTS = [
  { date: 'Jul 15', title: 'Finance Bill 2025 — First Reading', type: 'policy' },
  { date: 'Jul 22', title: 'MTEF Review Session', type: 'review' },
  { date: 'Aug 01', title: 'UN SDG Reporting Deadline', type: 'deadline' },
  { date: 'Aug 14', title: 'CBK Monetary Policy Committee', type: 'policy' },
  { date: 'Sep 01', title: 'Economic Survey 2025 Launch', type: 'release' },
];

const MESSAGES = [
  { role: 'them', author: 'Eng. Otieno (Infrastructure)', content: 'The Northern Bypass expansion is 68% complete. Timeline shows Q3 2026 completion.', time: '10:32' },
  { role: 'me', author: 'Dr. Wanjiru (Macroeconomics)', content: 'Good — that aligns with our 2027 GDP growth projection of 6.8%. Construction sector contribution remains positive.', time: '10:35' },
  { role: 'them', author: 'Eng. Otieno (Infrastructure)', content: 'Do road project timelines match your 2027 GDP projections?', time: '10:36' },
];

export default function CollaborationHub() {
  const { lang } = useLanguage();
  const [activeChannel, setActiveChannel] = useState(CHANNELS[0]);
  const [messages, setMessages] = useState(MESSAGES);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages(prev => [...prev, { role: 'me', author: 'You', content: input, time: 'now' }]);
    setInput('');
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-foreground">
            {lang === 'sw' ? 'Kituo cha Ushirikiano' : 'Collaboration Hub'}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {lang === 'sw' ? 'Mtandao wa kijamii wa ndani wa KIPPRA.' : 'The internal social network of KIPPRA — cross-directorate channels & sovereign calendar.'}
        </p>
      </motion.div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Channels list */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl border border-border bg-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5" />
              {lang === 'sw' ? 'Vituo' : 'Channels'}
            </h3>
            <div className="space-y-1">
              {CHANNELS.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => { setActiveChannel(ch); setMessages(MESSAGES); }}
                  className={`w-full text-left rounded-lg px-3 py-2.5 transition-colors ${
                    activeChannel.id === ch.id ? 'bg-secondary' : 'hover:bg-secondary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground truncate">{ch.name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0 ml-1">{ch.time}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{ch.members} members</p>
                </button>
              ))}
            </div>
          </div>

          {/* Sovereign Calendar */}
          <div className="mt-4 rounded-2xl border border-border bg-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {lang === 'sw' ? 'Kalenda ya Sera' : 'Sovereign Calendar'}
            </h3>
            <div className="space-y-2">
              {CALENDAR_EVENTS.map((event, i) => (
                <div key={i} className="flex gap-2.5">
                  <div className="flex flex-col items-center shrink-0">
                    <Calendar className={`h-3.5 w-3.5 ${
                      event.type === 'deadline' ? 'text-red-500' :
                      event.type === 'release' ? 'text-emerald-600' :
                      event.type === 'policy' ? 'text-blue-600' : 'text-amber-600'
                    }`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground leading-tight">{event.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{event.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-border bg-card flex flex-col h-[600px]">
            {/* Channel header */}
            <div className="border-b border-border px-5 py-3 flex items-center justify-between">
              <div>
                <h3 className="font-heading font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Hash className="h-4 w-4 text-primary" />
                  {activeChannel.name}
                </h3>
                <p className="text-[10px] text-muted-foreground">{activeChannel.members} members · {activeChannel.lastMsg}</p>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Brain className="h-3 w-3" />
                AlphaEconomist Active
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'me' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%] ${msg.role === 'me' ? '' : ''}`}>
                      <p className="text-[10px] text-muted-foreground mb-1 px-1">{msg.author} · {msg.time}</p>
                      <div className={`rounded-2xl px-4 py-2.5 text-sm ${
                        msg.role === 'me'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-secondary text-foreground rounded-bl-md'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Input */}
            <div className="border-t border-border p-3 flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={lang === 'sw' ? 'Andika ujumbe...' : 'Type a message...'}
                className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}