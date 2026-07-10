/**
 * ============================================================================
 * KEDIS UltraEconomist — Supabase Edge Function: Send Email
 * ============================================================================
 * Deploy: supabase functions deploy send-email --no-verify-jwt
 * Configure: supabase secrets set RESEND_API_KEY=re_...
 * ============================================================================
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { to, subject, body, from_name } = await req.json();
    const apiKey = Deno.env.get('RESEND_API_KEY');

    if (!apiKey) {
      throw new Error('RESEND_API_KEY not configured in Supabase secrets');
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${from_name || 'KEDIS UltraEconomist'} <noreply@kedis.go.ke>`,
        to: [to],
        subject,
        html: body,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Email API error: ${err}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});