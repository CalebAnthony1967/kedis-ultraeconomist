/**
 * ============================================================================
 * KEDIS UltraEconomist — AlphaEconomist RAG Edge Function
 * ============================================================================
 * Primary: Groq (Llama 3.3 70B)
 * Secondary: HuggingFace (Mixtral-8x7B-Instruct)
 * Fallback: Data summary
 * ============================================================================
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============================================================
// MAIN HANDLER
// ============================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const body = await req.json()
    const { query, history = [], filters = {}, conversationId = null } = body

    if (!query || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`🧠 Processing RAG query: "${query}"`)

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // ============================================================
    // STEP 1: RETRIEVE RELEVANT DATA
    // ============================================================
    const searchTerms = query.split(/\s+/).filter(w => w.length > 2).slice(0, 5)
    
    let supabaseQuery = supabase
      .from('indicators')
      .select('*')
      .limit(20)

    // Apply filters from context
    if (filters?.countyCodes && filters.countyCodes.length > 0) {
      supabaseQuery = supabaseQuery.in('county_code', filters.countyCodes)
    }

    if (filters?.entityLevels && filters.entityLevels.length > 0) {
      supabaseQuery = supabaseQuery.in('entity_level', filters.entityLevels)
    }

    if (filters?.yearStart) {
      supabaseQuery = supabaseQuery.gte('year', filters.yearStart)
    }

    if (filters?.yearEnd) {
      supabaseQuery = supabaseQuery.lte('year', filters.yearEnd)
    }

    // Search by name or search_text
    if (searchTerms.length > 0) {
      const searchCondition = searchTerms.map(term => 
        `search_text.ilike.%${term}%`
      ).join(',')
      supabaseQuery = supabaseQuery.or(searchCondition)
    }

    const { data: indicators, error: retrievalError } = await supabaseQuery

    if (retrievalError) {
      console.error('Retrieval error:', retrievalError)
    }

    const retrievedData = indicators || []
    console.log(`📊 Retrieved ${retrievedData.length} indicators`)

    // ============================================================
    // STEP 2: BUILD CONTEXT
    // ============================================================
    const contextData = retrievedData.slice(0, 10).map(ind => {
      const value = ind.value !== null && ind.value !== undefined 
        ? typeof ind.value === 'number' 
          ? ind.value.toLocaleString(undefined, { maximumFractionDigits: 2 })
          : ind.value
        : 'N/A'
      return `- ${ind.name} (${ind.year}): ${value} ${ind.unit || ''} | Source: ${ind.source_mcda || 'Unknown'}`
    }).join('\n')

    // Build conversation history context
    const historyContext = history && history.length > 0
      ? history.slice(-4).map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')
      : 'No previous conversation.'

    // ============================================================
    // STEP 3: GENERATE RESPONSE (Groq → HuggingFace → Fallback)
    // ============================================================
    let answer = ''
    let provider = 'fallback'
    let citations: string[] = []

    // Try Groq first
    const groqApiKey = Deno.env.get('VITE_GROQ_API_KEY')
    if (groqApiKey && !groqApiKey.startsWith('gsk_PASTE')) {
      try {
        console.log('🟢 Trying Groq...')
        const groqResponse = await callGroq(groqApiKey, query, contextData, historyContext)
        if (groqResponse) {
          answer = groqResponse.answer
          provider = 'groq'
          citations = groqResponse.citations || []
          console.log('✅ Groq response received')
        }
      } catch (e) {
        console.warn('Groq failed:', e.message)
      }
    }

    // Try HuggingFace if Groq failed
    if (!answer) {
      const hfToken = Deno.env.get('VITE_HF_TOKEN')
      if (hfToken && !hfToken.startsWith('hf_PASTE')) {
        try {
          console.log('🟡 Trying HuggingFace...')
          const hfResponse = await callHuggingFace(hfToken, query, contextData, historyContext)
          if (hfResponse) {
            answer = hfResponse.answer
            provider = 'huggingface'
            citations = hfResponse.citations || []
            console.log('✅ HuggingFace response received')
          }
        } catch (e) {
          console.warn('HuggingFace failed:', e.message)
        }
      }
    }

    // Ultimate fallback: data summary
    if (!answer) {
      console.log('⚠️ All LLMs failed, using fallback')
      answer = generateFallbackResponse(query, retrievedData)
      provider = 'fallback'
      citations = retrievedData.slice(0, 5).map(ind => ind.spi).filter(Boolean)
    }

    // ============================================================
    // STEP 4: SAVE TO DATABASE (if conversationId provided)
    // ============================================================
    if (conversationId && answer) {
      try {
        const { data: existing, error: fetchError } = await supabase
          .from('copilot_conversations')
          .select('messages')
          .eq('id', conversationId)
          .single()

        if (!fetchError && existing) {
          const currentMessages = existing.messages || []
          const newMessages = [
            ...currentMessages,
            { role: 'user', content: query },
            { role: 'assistant', content: answer },
          ]
          await supabase
            .from('copilot_conversations')
            .update({
              messages: newMessages,
              updated_at: new Date().toISOString(),
            })
            .eq('id', conversationId)
        }
      } catch (e) {
        console.warn('Failed to save conversation:', e)
      }
    }

    // ============================================================
    // STEP 5: RETURN RESPONSE
    // ============================================================
    return new Response(
      JSON.stringify({
        answer,
        provider,
        citations: citations.slice(0, 10),
        data: retrievedData.slice(0, 10),
        context_count: retrievedData.length,
        suggested_questions: generateSuggestedQuestions(query, retrievedData),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Fatal error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// ============================================================
// HELPERS: LLM CALLERS
// ============================================================

async function callGroq(apiKey: string, query: string, data: string, history: string) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are AlphaEconomist, a senior economic advisor for Kenya. 
Answer questions using the provided data. Cite SPI references when available.
Be analytical, concise, and professional.
If data is insufficient, state that clearly.`
        },
        {
          role: 'user',
          content: `Question: ${query}

Retrieved data:
${data || 'No specific data found.'}

Previous conversation:
${history || 'None'}

Please provide a helpful, evidence-based response.`
        }
      ],
      temperature: 0.7,
      max_tokens: 800,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Groq API error: ${response.status} - ${error}`)
  }

  const result = await response.json()
  const content = result.choices?.[0]?.message?.content || ''
  
  // Extract citations (SPI references)
  const citations = content.match(/KEDIS-SPI-[A-Z0-9]+/g) || []

  return { answer: content, citations }
}

async function callHuggingFace(token: string, query: string, data: string, history: string) {
  const prompt = `System: You are AlphaEconomist, a Kenyan economic policy assistant.
Answer the question using the provided data. Be concise and cite sources.

Question: ${query}

Data:
${data || 'No specific data found.'}

History:
${history || 'None'}

Answer:`

  const response = await fetch(
    'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          top_p: 0.95,
          do_sample: true,
          return_full_text: false,
        },
      }),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`HF API error: ${response.status} - ${error}`)
  }

  const result = await response.json()
  let content = ''
  
  if (Array.isArray(result) && result.length > 0 && result[0].generated_text) {
    content = result[0].generated_text
  } else if (result.generated_text) {
    content = result.generated_text
  } else {
    throw new Error('Unexpected HF response format')
  }

  const citations = content.match(/KEDIS-SPI-[A-Z0-9]+/g) || []
  return { answer: content.trim(), citations }
}

// ============================================================
// FALLBACK RESPONSE GENERATOR
// ============================================================

function generateFallbackResponse(query: string, data: any[]) {
  if (data.length === 0) {
    return `I couldn't find specific data for "${query}". Try adjusting your search terms or filters.`
  }

  const summary = data.slice(0, 5).map(ind => {
    const value = ind.value !== null && ind.value !== undefined 
      ? typeof ind.value === 'number' 
        ? ind.value.toLocaleString(undefined, { maximumFractionDigits: 2 })
        : ind.value
      : 'N/A'
    return `• ${ind.name}: ${value} ${ind.unit || ''} (${ind.year})`
  }).join('\n')

  return `Based on available data:\n\n${summary}\n\nI found ${data.length} indicators related to your query. Select one to view more details.`
}

function generateSuggestedQuestions(query: string, data: any[]) {
  const suggestions = []

  if (data.length > 0 && data[0]?.name) {
    suggestions.push(`Show me the trend for "${data[0].name}"`)
  }

  if (data.length > 1) {
    suggestions.push(`Compare ${data[0]?.name} with ${data[1]?.name}`)
  }

  suggestions.push('Show me related indicators')
  suggestions.push('Generate a report on these findings')

  return suggestions.slice(0, 4)
}
