/**
 * Conversation Memory – History & Context Management
 */

import { supabase } from '@/lib/supabaseClient';

/**
 * Save conversation to Supabase
 */
export async function saveConversation(conversationId, messages, title, language, sector) {
  const user = await supabase.auth.getUser();
  const userId = user.data.user?.id;

  const payload = {
    title: title || 'New Conversation',
    messages: messages,
    language: language || 'en',
    sector: sector || 'General',
    updated_at: new Date().toISOString(),
  };

  if (conversationId) {
    const { data, error } = await supabase
      .from('copilot_conversations')
      .update(payload)
      .eq('id', conversationId)
      .select('id')
      .single();
    if (error) throw error;
    return { id: conversationId };
  } else {
    const { data, error } = await supabase
      .from('copilot_conversations')
      .insert({ ...payload, created_by: userId })
      .select('id')
      .single();
    if (error) throw error;
    return { id: data.id };
  }
}

/**
 * Load conversation history
 */
export async function loadConversations(limit = 20) {
  const { data, error } = await supabase
    .from('copilot_conversations')
    .select('id, title, messages, language, sector, updated_at, created_at')
    .order('updated_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

/**
 * Load a single conversation with full history
 */
export async function loadConversation(conversationId) {
  const { data, error } = await supabase
    .from('copilot_conversations')
    .select('*')
    .eq('id', conversationId)
    .single();
  if (error) throw error;
  return data;
}

/**
 * Delete a conversation
 */
export async function deleteConversation(conversationId) {
  const { error } = await supabase
    .from('copilot_conversations')
    .delete()
    .eq('id', conversationId);
  if (error) throw error;
  return true;
}

/**
 * Build context from conversation history
 */
export function buildConversationContext(messages, maxTurns = 5) {
  if (!messages || messages.length === 0) return '';

  const recent = messages.slice(-maxTurns * 2); // User + Assistant pairs
  return recent.map(m => {
    const role = m.role === 'user' ? 'User' : 'Assistant';
    return `${role}: ${m.content}`;
  }).join('\n');
}

/**
 * Extract key entities from conversation history
 */
export function extractContextEntities(messages) {
  const entities = {
    indicators: [],
    counties: [],
    years: [],
    domains: [],
  };

  // Simple extraction from last 10 messages
  const recent = messages.slice(-10);
  const text = recent.map(m => m.content).join(' ');

  // Extract years
  const yearMatches = text.match(/\b(20\d{2})\b/g);
  if (yearMatches) {
    entities.years = [...new Set(yearMatches.map(Number).sort())];
  }

  // Extract counties (common ones)
  const counties = ['nairobi', 'mombasa', 'kisumu', 'nakuru', 'kiambu', 'meru', 'kilifi'];
  for (const county of counties) {
    if (text.toLowerCase().includes(county)) {
      entities.counties.push(county.charAt(0).toUpperCase() + county.slice(1));
    }
  }

  // Extract indicators
  const indicators = ['gdp', 'growth', 'inflation', 'debt', 'revenue', 'health', 'education'];
  for (const ind of indicators) {
    if (text.toLowerCase().includes(ind)) {
      entities.indicators.push(ind);
    }
  }

  return entities;
}
