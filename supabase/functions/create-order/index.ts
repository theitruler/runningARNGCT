import Razorpay from 'npm:razorpay@2.9.6'
import { createClient } from 'npm:@supabase/supabase-js@2.98.0'

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' }
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { event_id, participant } = await req.json()
    const fallbackRaceOptions: Record<string, string[]> = { Walking: ['3K', '5K'], Running: ['3K', '5K', '10K', '21K'], Cycling: ['10K', '20K', '50K'] }
    if (!event_id || !participant?.name || !participant?.email || !participant?.phone || !participant?.shipping_address || !participant?.city || !participant?.pincode || !participant?.sport_category || !participant?.distance_category) return json({ error: 'Please complete every registration detail and choose a race type and distance.' }, 400)
    const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const { data: event } = await db.from('events').select('id,title,fee,status,category').eq('id', event_id).single()
    if (!event || event.status !== 'published') return json({ error: 'This event is not available.' }, 404)
    const { data: eventRaceOptions, error: raceOptionsError } = await db.from('event_race_options').select('race_type,distance').eq('event_id', event.id)
    if (raceOptionsError) throw raceOptionsError
    const validRaceOption = eventRaceOptions.length
      ? eventRaceOptions.some(option => option.race_type === participant.sport_category && option.distance === participant.distance_category)
      : fallbackRaceOptions[participant.sport_category]?.includes(participant.distance_category)
    if (!validRaceOption) return json({ error: 'That race type and distance are not available for this event.' }, 400)
    if (event.category === 'reddit' && !/^https?:\/\/(www\.)?reddit\.com\/user\/[^/?#]+\/?$/i.test(participant.reddit_url || '')) return json({ error: 'Please provide a valid Reddit profile URL for this Reddit event.' }, 400)
    if (event.category === 'real_meetup' && (!participant.emergency_contact_name || !participant.emergency_contact_relationship || !participant.emergency_contact_phone || participant.meetup_waiver !== 'accepted')) return json({ error: 'Please complete the meet-up safety details and accept the participation waiver.' }, 400)
    const razorpay = new Razorpay({ key_id: Deno.env.get('RAZORPAY_KEY_ID')!, key_secret: Deno.env.get('RAZORPAY_KEY_SECRET')! })
    const order = await razorpay.orders.create({ amount: event.fee * 100, currency: 'INR', receipt: `event_${event.id.slice(0, 8)}_${Date.now()}`, notes: { event_id: event.id } })
    return json({ key_id: Deno.env.get('RAZORPAY_KEY_ID'), order })
  } catch (error) { return json({ error: error.message || 'Unable to create payment order.' }, 500) }
})
