// supabase/functions/explorer-api/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const url = new URL(req.url)
    const endpoint = url.pathname.split('/').pop()
    const params = Object.fromEntries(url.searchParams)

    // GET /explorer-api/search
    if (endpoint === 'search' && req.method === 'GET') {
      const { data, error } = await supabase.rpc('search_explorer', {
        p_query: params.q || null,
        p_domain_ids: params.domains?.split(',') || null,
        p_subdomain_ids: params.subdomains?.split(',') || null,
        p_pillars: params.pillars?.split(',') || null,
        p_county_codes: params.counties?.split(',') || null,
        p_source_mcdas: params.sources?.split(',') || null,
        p_year_start: params.year_start ? parseInt(params.year_start) : null,
        p_year_end: params.year_end ? parseInt(params.year_end) : null,
        p_entity_level: params.entity_levels?.split(',') || null,
        p_limit: params.limit ? parseInt(params.limit) : 20,
        p_offset: params.offset ? parseInt(params.offset) : 0,
      })

      if (error) throw error

      return new Response(
        JSON.stringify({ 
          data, 
          total: data && data.length > 0 ? data[0].total_count : 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // GET /explorer-api/domains
    if (endpoint === 'domains' && req.method === 'GET') {
      const { data, error } = await supabase.rpc('get_domain_tree')
      if (error) throw error
      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /explorer-api/counties
    if (endpoint === 'counties' && req.method === 'GET') {
      const { data, error } = await supabase.rpc('get_counties_with_counts')
      if (error) throw error
      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /explorer-api/series/:indicatorId
    if (endpoint === 'series' && req.method === 'GET') {
      const indicatorId = params.indicator_id
      if (!indicatorId) {
        return new Response(
          JSON.stringify({ error: 'indicator_id required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { data, error } = await supabase.rpc('get_indicator_series', {
        p_indicator_id: indicatorId,
        p_county_code: params.county || null,
      })
      if (error) throw error
      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 404
    return new Response(
      JSON.stringify({ error: 'Endpoint not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
