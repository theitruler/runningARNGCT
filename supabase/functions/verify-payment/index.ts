import Razorpay from 'npm:razorpay@2.9.6'
import { createClient } from 'npm:@supabase/supabase-js@2.98.0'

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
const hex = (buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer)).map(x => x.toString(16).padStart(2, '0')).join('')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, registration } = await req.json()
    const participant = registration?.participant
    const sportDistances: Record<string, string[]> = { Walking: ['3K', '5K'], Running: ['3K', '5K', '10K', '21K'], Cycling: ['10K', '20K', '50K'] }
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !registration?.event_id || !participant?.name || !participant?.email || !participant?.phone || !participant?.shipping_address || !participant?.city || !participant?.pincode || !sportDistances[participant.sport_category]?.includes(participant.distance_category)) return json({ error: 'Payment or registration details are incomplete.' }, 400)
    const cryptoKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(Deno.env.get('RAZORPAY_KEY_SECRET')!), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const signature = hex(await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(`${razorpay_order_id}|${razorpay_payment_id}`)))
    if (signature !== razorpay_signature) return json({ error: 'Payment signature is invalid.' }, 400)
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: event } = await db.from('events').select('id,fee,status,category').eq('id', registration.event_id).single()
    if (!event || event.status !== 'published') return json({ error: 'This event is not available.' }, 404)
    if (event.category === 'reddit' && !/^https?:\/\/(www\.)?reddit\.com\/user\/[^/?#]+\/?$/i.test(participant.reddit_url || '')) return json({ error: 'Please provide a valid Reddit profile URL for this Reddit event.' }, 400)
    if (event.category === 'real_meetup' && (!participant.emergency_contact_name || !participant.emergency_contact_relationship || !participant.emergency_contact_phone || participant.meetup_waiver !== 'accepted')) return json({ error: 'Meet-up safety details or the participation waiver are missing.' }, 400)
    const razorpay = new Razorpay({ key_id: Deno.env.get('RAZORPAY_KEY_ID')!, key_secret: Deno.env.get('RAZORPAY_KEY_SECRET')! })
    const order = await razorpay.orders.fetch(razorpay_order_id)
    if (order.status !== 'paid' || order.notes?.event_id !== event.id || order.amount !== event.fee * 100) return json({ error: 'The payment order does not match this registration.' }, 400)
    const { data: record, error } = await db.from('participants').insert({ event_id: event.id, name: participant.name, email: participant.email.toLowerCase(), phone: participant.phone, distance_category: participant.distance_category, sport_category: participant.sport_category, reddit_url: event.category === 'reddit' ? participant.reddit_url : null, emergency_contact_name: event.category === 'real_meetup' ? participant.emergency_contact_name : null, emergency_contact_relationship: event.category === 'real_meetup' ? participant.emergency_contact_relationship : null, emergency_contact_phone: event.category === 'real_meetup' ? participant.emergency_contact_phone : null, medical_notes: event.category === 'real_meetup' ? participant.medical_notes || null : null, meetup_waiver_accepted: event.category === 'real_meetup', shipping_address: participant.shipping_address, city: participant.city, pincode: participant.pincode, payment_status: 'paid', razorpay_order_id, razorpay_payment_id, paid_at: new Date().toISOString() }).select('id').single()
    if (error) throw error
    return json({ ok: true, participant_id: record.id })
  } catch (error) { return json({ error: error.message || 'Unable to verify payment.' }, 500) }
})
