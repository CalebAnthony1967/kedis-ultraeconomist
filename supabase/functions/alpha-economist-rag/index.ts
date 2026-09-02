import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const { query, history, filters } = await req.json()

    // Retrieve relevant data
    const { data: indicators, error } = await supabase
      .from('indicators')
      .select('*')
      .or(`name.ilike.%${query}%,search_text.ilike.%${query}%`)
      .limit(15)

    if (error) throw error

    // Build context
    const context = indicators.map(ind =>
      `- ${ind.name} (${ind.year}): ${ind.value} ${ind.unit || ''} | Source: ${ind.source_mcda || 'Unknown'}`
    ).join('\n')

    // Generate response using Groq
    const groqKey = Deno.env.get('VITE_GROQ_API_KEY')
    let answer = ''

    if (groqKey) {
      const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are AlphaEconomist, a Kenyan economic policy assistant. Answer questions using the provided data. Cite sources.'
            },
            {
              role: 'user',
              content: `Query: ${query}\n\nData:\n${context || 'No specific data found.'}\n\nProvide a helpful response.`
            }
          ],
          temperature: 0.7,
          max_tokens: 800,
        }),
      })

      if (groqResponse.ok) {
        const data = await groqResponse.json()
        answer = data.choices[0].message.content
      }
    }

    if (!answer) {
      // Fallback to HuggingFace
      const hfToken = Deno.env.get('VITE_HF_TOKEN')
      if (hfToken) {
        const prompt = `Question: ${query}\n\nData:\n${context || 'No specific data found.'}\n\nAnswer:`
        const hfResponse = await fetch(
          'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1',
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${hfToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              inputs: prompt,
              parameters: { max_new_tokens: 500, temperature: 0.7 },
            }),
          }
        )
        if (hfResponse.ok) {
          const data = await hfResponse.json()
          answer = data.generated_text || data[0]?.generated_text || ''
        }
      }
    }

    // Ultimate fallback
    if (!answer) {
      answer = `Based on ${indicators.length} indicators found:\n\n${context}\n\nSelect an indicator to view more details.`
    }

    return new Response(
      JSON.stringify({
        answer,
        citations: indicators.map(ind => ind.spi).filter(Boolean),
        provider: answer.includes('Based on') ? 'fallback' : 'groq',
        data: indicators.slice(0, 10),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
