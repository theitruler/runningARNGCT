import { createClient } from 'npm:@supabase/supabase-js@2.98.0'

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { email, event_id, activity_url, note, proof_base64, proof_name, proof_type } = await req.json()
    if (!email || !event_id || (!activity_url && !proof_base64)) return json({ error: 'Add your registration email, event and proof.' }, 400)
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: participant } = await db.from('participants').select('id').eq('email', email.toLowerCase()).eq('event_id', event_id).eq('payment_status', 'paid').maybeSingle()
    if (!participant) return json({ error: 'No paid registration was found for that email and event.' }, 404)
    let proof_path = null
    if (proof_base64) {
      const bytes = Uint8Array.from(atob(proof_base64), c => c.charCodeAt(0))
      if (bytes.length > 8 * 1024 * 1024) return json({ error: 'Proof file exceeds 8 MB.' }, 400)
      proof_path = `${participant.id}/${crypto.randomUUID()}-${(proof_name || 'proof').replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const { error: uploadError } = await db.storage.from('run-proofs').upload(proof_path, bytes, { contentType: proof_type || 'application/octet-stream' })
      if (uploadError) throw uploadError
    }
    const { error } = await db.from('submissions').insert({ participant_id: participant.id, activity_url: activity_url || null, proof_path, note: note || null })
    if (error) throw error
    return json({ ok: true })
  } catch (error) { return json({ error: error.message || 'Unable to submit proof.' }, 500) }
})
