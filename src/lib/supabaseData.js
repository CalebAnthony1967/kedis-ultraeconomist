/**
 * ============================================================================
 * KEDIS UltraEconomist — Sovereign Intelligence Access Layer (v14.0 Production)
 * ============================================================================
 * Backend: Supabase (PostgreSQL + pgvector)
 * AI: Sovereign Open-Source Inference (Llama-3 & Embeddings via HF)
 * Standards: FAIR, CIA Triad, KDPA, SDMX
 * ============================================================================
 */

import { supabase } from './supabaseClient';

// --- PRODUCTION AI CONFIGURATION (SOVEREIGN OPEN SOURCE) ---
const HF_EMBED_MODEL = "sentence-transformers/all-MiniLM-L6-v2";
const HF_LLM_MODEL = "meta-llama/Meta-Llama-3-8B-Instruct";
const HF_TOKEN = import.meta.env.VITE_HF_TOKEN; 

/**
 * GENERIC CRUD FACTORY
 * Provides standardized methods for all system entities
 */
const createEntity = (tableName) => ({
  async list(sort = '-created_at', limit = 100) {
    let query = supabase.from(tableName).select('*');
    if (sort) {
      const isDesc = sort.startsWith('-');
      const column = isDesc ? sort.substring(1) : sort;
      query = query.order(column, { ascending: !isDesc });
    }
    const { data, error } = await query.limit(limit);
    if (error) throw error;
    return data;
  },
  async get(id) {
    const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },
  async create(payload) {
    const { data, error } = await supabase.from(tableName).insert(payload).select().single();
    if (error) throw error;
    return data;
  },
  async update(id, payload) {
    const { data, error } = await supabase.from(tableName).update(payload).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async delete(id) {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    if (error) throw error;
    return true;
  }
});

/**
 * EXPORT 1: supabaseEntities
 * Primary data access for standard UI pages
 */
export const supabaseEntities = {
  Indicator: createEntity('indicators'),
  WardData: createEntity('ward_data'),
  DataIngestionJob: createEntity('data_ingestion_jobs'),
  DataConnector: createEntity('data_connectors'),
  AuditLog: createEntity('audit_logs'),
  SDGTarget: createEntity('sdg_targets'),
  CopilotConversation: createEntity('copilot_conversations'),
  ReportDraft: createEntity('report_drafts'),
  PolicyScenario: createEntity('policy_scenarios'),
  CitizenFeedback: createEntity('citizen_feedback'),
  User: createEntity('profiles'),
};

/**
 * EXPORT 2: lakehouse
 * Specialized intelligence orchestration (Silo-healing, AI, Causal modeling)
 */
export const lakehouse = {
  
  ingestion: {
    /** SILO-HEALING: Resolves fragmentation via Supabase Edge Function */
    async healAndSync(fileData, mcdaName) {
      const { data, error } = await supabase.functions.invoke('process-silo', {
        body: { payload: fileData, mcda: mcdaName }
      });
      if (error) throw error;
      
      await lakehouse.governance.logInstitutionalEvent('DATA_SYNC', `Silo-healing completed for ${mcdaName}`);
      return data;
    },

    /** Registers metadata under FAIR principles */
    async registerDataset(mcdaInfo, tableId, hash) {
      const spi = `SPI-KE-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
      const { data, error } = await supabase.from('master_pool').insert({
        spi, mcda: mcdaInfo.name, category: mcdaInfo.category, 
        data_table: tableId, integrity_hash: hash, timestamp: new Date().toISOString(),
        fair_score: 1.0, is_anonymized: true
      }).select().single();
      if (error) throw error;
      return data;
    }
  },

  intelligence: {
    /** POLICY RAG: Generates grounded advice using open-source models */
    async getGroundedPolicyAdvice(userQuery) {
      try {
        const embedding = await this.generateSovereignEmbedding(userQuery);
        const { data: policyChunks } = await supabase.rpc('match_policy_chunks', {
          query_embedding: embedding,
          match_threshold: 0.45,
          match_count: 3
        });
        const { data: indicators } = await supabase.from('indicator_data').select('*')
          .textSearch('indicator_name', userQuery.split(' ').join(' | ')).limit(3);
        
        return await this.invokeSovereignLLM(userQuery, policyChunks, indicators);
      } catch (err) {
        return "AlphaEconomist System Alert: Recalibrating causal models. Please retry.";
      }
    },

    async generateSovereignEmbedding(text) {
      const response = await fetch(`https://api-inference.huggingface.co/pipeline/feature-extraction/${HF_EMBED_MODEL}`, {
        headers: { Authorization: `Bearer ${HF_TOKEN}` },
        method: "POST",
        body: JSON.stringify({ inputs: text }),
      });
      return await response.json();
    },

    async invokeSovereignLLM(query, context, data) {
      const prompt = `<|begin_of_text|><|start_header_id|>system<|end_header_id|>
        You are AlphaEconomist. Answer using ONLY this context:
        Context: ${JSON.stringify(context)}
        Evidence: ${JSON.stringify(data)}<|eot_id|>
        <|start_header_id|>user<|end_header_id|>${query}<|eot_id|>
        <|start_header_id|>assistant<|end_header_id|>`;

      const response = await fetch(`https://api-inference.huggingface.co/models/${HF_LLM_MODEL}`, {
        headers: { Authorization: `Bearer ${HF_TOKEN}`, "Content-Type": "application/json" },
        method: "POST",
        body: JSON.stringify({ inputs: prompt, parameters: { max_new_tokens: 400, temperature: 0.1, return_full_text: false } }),
      });
      const result = await response.json();
      return result[0].generated_text;
    }
  },

  dissemination: {
    async getRegistry(persona = 'Citizen') {
      let query = supabase.from('master_pool').select('mcda, category, timestamp, spi');
      if (persona === 'Independent Researcher') query = query.select('*');
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  },

  governance: {
    async logInstitutionalEvent(action, details) {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('audit_logs').insert({
        user_id: user?.id, action, details, timestamp: new Date().toISOString()
      });
    }
  }
};

export default supabaseEntities;