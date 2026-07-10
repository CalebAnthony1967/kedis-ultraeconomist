/**
 * ============================================================================
 * KEDIS UltraEconomist — Sovereign Supabase Client
 * ============================================================================
 * Security Tier: High-End / Government Standard
 * Features: Hardened Auth, Low-Latency Realtime, Application-Level Identity
 * ============================================================================
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('CRITICAL: Sovereign Infrastructure Variables missing from .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // Required for cross-tab research sessions
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // Modern, secure flow for web apps
    storageKey: 'kedis_auth_token', // Isolated namespace
  },
  realtime: {
    params: { eventsPerSecond: 20 }, // High-frequency for real-time nowcasting
  },
  global: {
    // Custom header for server-side audit logs to identify requests from KEDIS
    headers: { 'x-kedis-sovereign-agent': 'UltraEconomist-v13' },
  },
});

export default supabase;