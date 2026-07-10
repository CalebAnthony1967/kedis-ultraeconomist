/**
 * ============================================================================
 * KEDIS UltraEconomist — Sovereign Bridge Adapter
 * ============================================================================
 * This file replaces the Base44 SDK with the Supabase Data Layer.
 * It provides a compatibility layer so that existing imports of 'base44' 
 * are intelligently routed to the Sovereign Supabase Lakehouse.
 * ============================================================================
 */

import { supabaseEntities, lakehouse } from '@/lib/supabaseData';
import { supabaseAuth } from '@/lib/supabaseAuth';

// We export 'supabaseEntities' aliased as 'base44' to fix 
// system-wide import errors while we migrate files one-by-one.
export const base44 = {
  ...supabaseEntities,
  
  // Bridge the Auth methods to match the expected Base44 signature
  auth: {
    me: () => supabaseAuth.me(),
    logout: (url) => supabaseAuth.logout(url),
    login: (e, p) => supabaseAuth.loginViaEmailPassword(e, p)
  },
  
  // Attach the advanced intelligence layer
  intelligence: lakehouse.intelligence,
  ingestion: lakehouse.ingestion
};

// Default export for absolute compatibility
export default base44;