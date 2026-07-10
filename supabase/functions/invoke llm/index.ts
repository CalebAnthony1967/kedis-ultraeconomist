/**
 * ============================================================================
 * KEDIS UltraEconomist — Supabase Edge Function: Hugging Face LLM (RAG)
 * ============================================================================
 * Deploy: supabase functions deploy invoke-llm-hf --no-verify-jwt
 *
 * Receives a prompt + context, calls Hugging Face Inference API,
 * returns the generated text. Use this for server-side RAG calls
 * to keep the HF token secure (set as Supabase secret).
 *
 *   supabase secrets set HF_TOKEN=hf_xxx
 * ============================================================================
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const HF_MODEL = 'mistralai/Mistral-7B-Instruct-v0.3';
const FALLBACK_MODELS = [
  'HuggingFaceH4/zephyr-7b-beta',
  'meta-llama/Meta-Llama-3-8B-Instruct',
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { system_prompt, user_prompt, conversation_history, language } = await req.json();

    const hfToken = Deno.env.get('HF_TOKEN');
    if (!hfToken) {
      throw new Error('HF_TOKEN not configured in Supabase secrets');
    }

    const langInstruction = language === 'sw' ? 'Swahili' : 'English';

    const messages = [];

    if (system_prompt) {
      messages.push({ role: 'system', content: system_prompt });
    } else {
      messages.push({
        role: 'system',
        content: `You are AlphaEconomist, Kenya's sovereign economic intelligence AI. Use ONLY the verified data provided in context. Cite SPI identifiers in [SPI:XXX] format. Provide PROBABILITY: XX% for policy targets. Respond in ${langInstruction}.`,
      });
    }

    // Add conversation history
    if (conversation_history && Array.isArray(conversation_history)) {
      for (const msg of conversation_history.slice(-4)) {
        messages.push({ role: msg.role === 'user' ? 'user' : 'assistant', content: msg.content });
      }
    }

    messages.push({ role: 'user', content: user_prompt });

    // Try primary model, then fallbacks
    const models = [HF_MODEL, ...FALLBACK_MODELS];
    let lastError = null;

    for (const model of models) {
      try {
        const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${hfToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: 0.3,
            max_tokens: 1500,
            top_p: 0.9,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`HF API ${response.status}: ${errText.substring(0, 200)}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';

        return new Response(JSON.stringify({ response: content, model }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (err) {
        lastError = err;
        console.warn(`Model ${model} failed:`, err.message);
      }
    }

    throw new Error(`All models failed. Last error: ${lastError?.message}`);
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});