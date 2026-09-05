import './style.css'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null
const redditProfileVideo = { bucket: 'reddit video', path: 'WhatsApp Video 2026-09-04 at 6.16.05 PM.mp4' }

const app = document.querySelector('#root')
const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)
const escape = (value = '') => String(value).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c])
const bySlug = (slug) => window.__events?.find(event => event.slug === slug || event.id === slug)
const sportDistances = { Walking: ['3K', '5K'], Running: ['3K', '5K', '10K', '21K'], Cycling: ['10K', '20K', '50K'] }
const defaultRaceOptions = Object.entries(sportDistances).flatMap(([race_type, distances]) => distances.map(distance => ({ race_type, distance })))
const eventRaceOptions = (event) => event.event_race_options?.length ? event.event_race_options : defaultRaceOptions
const raceTypes = (options) => [...new Set(options.map(option => option.race_type))]
const distanceOptions = (options, raceType) => options.filter(option => option.race_type === raceType).map(option => option.distance)

async function readableFunctionError(error, fallback) {
  try {
    const payload = await error?.context?.json?.()
    return payload?.error || fallback
  } catch {
    return error?.message || fallback
  }
}

async function events() {
  if (!supabase) return []
  const { data, error } = await supabase.from('events').select('*, event_race_options(id, race_type, distance)').eq('status', 'published').order('event_date', { ascending: true })
  if (error) {
    console.error('Unable to load events:', error)
    return []
  }
  return data || []
}

function shell(content) {
  app.innerHTML = `<header><a class="brand" href="#/">stride<span>.</span></a><nav><a href="#/">Events</a><a href="#/submit">Submit run</a></nav></header>${content}<footer><div><div class="brand">stride<span>.</span></div><small>Powered by ARNGCT</small></div><p>Virtual events supporting community impact, one finish line at a time.</p><a href="#/submit">Already finished? Submit your activity →</a></footer>`
}

function eventCard(event) {
  const category = event.category || 'virtual'; const categoryLabel = category === 'real_meetup' ? 'Real meet-up' : category
  return `<a class="event-card" href="#/event/${escape(event.slug || event.id)}"><div class="image-wrap"><img src="${escape(event.image_url)}" alt="${escape(event.title)}"/><span class="category-chip ${escape(category.replace('_', '-'))}">${escape(categoryLabel)}</span><span class="date">${escape(event.event_date)}</span></div><div class="event-copy"><p class="eyebrow">${escape(event.distance)} · Move for good</p><h3>${escape(event.title)}</h3><p>${escape(event.short_description)}</p><div class="card-bottom"><strong>${money(event.fee)}</strong><span>Join challenge <b>→</b></span></div></div></a>`
}

async function home() {
  shell(`<main><section class="hero"><div><p class="eyebrow light">Powered by ARNGCT · since good hearts began moving</p><h1>Every mile<br/>means more.</h1><p class="hero-copy">Pick a route, move to your own beat, and turn your finish line into support for ARN Growth Charitable Trust.</p><a class="button warm" href="#events">Find your feel-good run <b>→</b></a></div><div class="hero-stat"><strong>MOVE<br/>WITH ♥</strong><span>for a brighter<br/>tomorrow</span></div></section><section id="events" class="events-section"><div class="section-intro"><p class="eyebrow">Lace up for good</p><h2>Good vibes. Great cause.</h2><p>Choose a challenge, move anywhere, and help a worthy mission go further.</p></div><div id="event-grid" class="event-grid"><div class="loading">Loading events…</div></div></section><section class="how"><p class="eyebrow">Three feel-good moves</p><h2>Do good. Feel the groove.</h2><div class="steps"><div><i>01</i><h3>Pick your moment</h3><p>Choose an event, a sport and the distance that feels right.</p></div><div><i>02</i><h3>Move your way</h3><p>Walk, run or cycle wherever your happy place is.</p></div><div><i>03</i><h3>Share the joy</h3><p>Show us your activity and your medal starts its journey.</p></div></div></section></main>`)
  const list = await events(); window.__events = list
  document.querySelector('#event-grid').innerHTML = list.length
    ? list.map(eventCard).join('')
    : '<div class="loading">No events are available right now. Please check back soon.</div>'
}

function details(event) {
  const options = eventRaceOptions(event)
  const types = raceTypes(options)
  const initialType = types[0]
  const initialDistances = distanceOptions(options, initialType)
  const redditField = event.category === 'reddit' ? `<label>Reddit profile URL<input required type="url" name="reddit_url" placeholder="https://www.reddit.com/u/your-name"/><em>Profile and shared profile links are accepted.</em></label><button class="reddit-profile-help" id="reddit-profile-help" type="button">How do I get my Reddit profile link?</button>` : ''
  const meetupFields = event.category === 'real_meetup' ? `<div class="meetup-fields"><p class="eyebrow">Meet-up safety details</p><div class="two-col"><label>Emergency contact name<input required name="emergency_contact_name" placeholder="Contact name" autocomplete="name"/></label><label>Relationship<input required name="emergency_contact_relationship" placeholder="e.g. Parent, friend"/></label></div><label>Emergency contact number<input required name="emergency_contact_phone" inputmode="tel" placeholder="Emergency phone number"/></label><label>Medical notes <em>optional — allergies, conditions or accessibility needs</em><textarea name="medical_notes" rows="2" placeholder="Only share what our event team should know."></textarea></label><label class="waiver"><input required type="checkbox" name="meetup_waiver" value="accepted"/> <span>I confirm I am fit to participate and accept the event safety guidelines.</span></label></div>` : ''
  shell(`<main><section class="event-hero"><img src="${escape(event.image_url)}" alt="${escape(event.title)}"/><div class="event-hero-overlay"></div><a class="back" href="#/">← All events</a><div class="event-hero-copy"><p class="eyebrow light">${escape((event.category || 'virtual').replace('_', ' '))} event · powered by ARNGCT</p><h1>${escape(event.title)}</h1><p>${escape(event.short_description)}</p></div></section><section class="detail-layout"><article class="event-details"><p class="eyebrow">The challenge</p><h2>Move for a<br/>meaningful cause.</h2><p>${escape(event.description)}</p><div class="detail-meta"><div><span>WHEN TO COMPLETE</span><strong>${escape(event.event_date)}</strong></div><div><span>REGISTRATION CLOSES</span><strong>${escape(event.registration_end)}</strong></div><div><span>YOUR REWARD</span><strong>${escape(event.medal_text || 'Finisher medal')}</strong></div></div></article><aside class="register-card"><div class="register-price"><span>Registration</span><strong>${money(event.fee)}</strong></div><p>Supports ARN Growth Charitable Trust. Includes medal, digital bib and delivery within India.</p><button class="button dark" id="register-button">Register for this event <b>→</b></button><small>Secure payment powered by Razorpay</small></aside></section><section id="register" class="registration"><div><p class="eyebrow">Almost there</p><h2>Make your impact official.</h2><p>Choose from the race types and distances available for this event, then tell us where to send your medal.</p></div><form id="registration-form"><input type="hidden" name="event_id" value="${escape(event.id)}"/><label>Full name<input required name="name" placeholder="Your name" autocomplete="name"/></label><div class="two-col"><label>Email address<input required type="email" name="email" placeholder="you@example.com" autocomplete="email"/></label><label>Phone number<input required name="phone" inputmode="tel" placeholder="10-digit number" autocomplete="tel"/></label></div><div class="two-col"><label>Race type<select required name="sport_category" id="race-type">${types.map(type => `<option value="${escape(type)}">${escape(type)}</option>`).join('')}</select></label><label>Distance<select required name="distance_category" id="distance-category">${initialDistances.map(distance => `<option value="${escape(distance)}">${escape(distance)}</option>`).join('')}</select></label></div>${redditField}${meetupFields}<label>Shipping address<textarea required name="shipping_address" rows="3" placeholder="House / street / area"></textarea></label><div class="two-col"><label>City<input required name="city" placeholder="City"/></label><label>PIN code<input required name="pincode" inputmode="numeric" placeholder="PIN code"/></label></div><button class="button warm full" type="submit">Continue to payment · ${money(event.fee)} <b>→</b></button><p class="form-note">Your registration is saved only after Razorpay confirms payment.</p></form></section></main>`)
  document.querySelector('#register-button').addEventListener('click', () => document.querySelector('#register').scrollIntoView({ behavior: 'smooth' }))
  document.querySelector('#race-type').addEventListener('change', (e) => {
    document.querySelector('#distance-category').innerHTML = distanceOptions(options, e.target.value).map(distance => `<option value="${escape(distance)}">${escape(distance)}</option>`).join('')
  })
  document.querySelector('#reddit-profile-help')?.addEventListener('click', openRedditProfileVideo)
  document.querySelector('#registration-form').addEventListener('submit', (e) => checkout(e, event))
}

function showVideo(url) {
  const modal = document.createElement('div')
  modal.className = 'video-modal'
  modal.innerHTML = `<div class="video-modal-card" role="dialog" aria-modal="true" aria-labelledby="video-title"><div class="video-modal-heading"><h3 id="video-title">Finding your Reddit profile link</h3><button type="button" class="video-modal-close" aria-label="Close video">×</button></div><video controls autoplay playsinline src="${escape(url)}">Your browser cannot play this video.</video></div>`
  const close = () => modal.remove()
  modal.addEventListener('click', (event) => { if (event.target === modal) close() })
  modal.querySelector('.video-modal-close').addEventListener('click', close)
  document.body.append(modal)
}

async function openRedditProfileVideo(event) {
  const button = event.currentTarget
  if (!supabase) return alert('Add your Supabase credentials to view the tutorial video.')
  button.disabled = true
  button.textContent = 'Loading video…'
  try {
    const { data } = supabase.storage.from(redditProfileVideo.bucket).getPublicUrl(redditProfileVideo.path)
    showVideo(data.publicUrl)
  } catch (error) {
    alert(await readableFunctionError(error, 'Unable to load the tutorial video. Please try again.'))
  } finally {
    button.disabled = false
    button.textContent = 'How do I get my Reddit profile link?'
  }
}

function loadRazorpay() { return new Promise((resolve, reject) => { if (window.Razorpay) return resolve(); const script = document.createElement('script'); script.src = 'https://checkout.razorpay.com/v1/checkout.js'; script.onload = resolve; script.onerror = reject; document.head.append(script) }) }

async function checkout(e, event) {
  e.preventDefault(); const form = e.currentTarget; const button = form.querySelector('button'); const participant = Object.fromEntries(new FormData(form)); button.disabled = true; button.textContent = 'Preparing secure checkout…'
  try {
    if (!supabase) throw new Error('Add your Supabase credentials to enable payments.')
    const { data, error } = await supabase.functions.invoke('create-order', { body: { event_id: event.id, participant } })
    if (error) throw error
    await loadRazorpay()
    const razorpay = new window.Razorpay({ key: data.key_id, amount: data.order.amount, currency: data.order.currency, name: 'Stride', description: event.title, order_id: data.order.id, prefill: { name: participant.name, email: participant.email, contact: participant.phone }, theme: { color: '#f25c54' }, handler: async (response) => { const { data: verified, error: verifyError } = await supabase.functions.invoke('verify-payment', { body: { ...response, registration: { event_id: event.id, participant } } }); if (verifyError) return alert(await readableFunctionError(verifyError, 'Payment was received but verification is pending. Please contact support.')); window.location.hash = `#/success/${verified.participant_id}` } })
    razorpay.open()
  } catch (error) { alert(await readableFunctionError(error, 'Unable to start payment. Please try again.')); button.disabled = false; button.innerHTML = `Continue to payment · ${money(event.fee)} <b>→</b>` }
}

function submission() {
  shell(`<main class="submission-page"><section class="submit-intro"><p class="eyebrow">The victory lap</p><h1>Show the world<br/>your sparkle.</h1><p>Share a Strava link or a snap from your app. When your activity is approved, we’ll get your feel-good medal moving.</p><div class="proof-types"><span>↗ Strava activity link</span><span>▣ Screenshot upload</span></div></section><section class="submit-panel"><div class="submit-heading"><p class="eyebrow">Log your good deed</p><h2>One groovy last step.</h2></div><form id="submission-form"><label>Registration email<input required type="email" name="email" placeholder="The email used to register"/></label><label>Select your event<select required name="event_id" id="submission-event"><option value="">Loading events…</option></select></label><label>Strava / activity link <em>optional</em><input type="url" name="activity_url" placeholder="https://www.strava.com/activities/..."/></label><label>Or upload a screenshot <em>PNG, JPG or PDF · max 8 MB</em><input type="file" name="proof" accept="image/png,image/jpeg,application/pdf"/></label><label>Anything we should know? <em>optional</em><textarea name="note" rows="3" placeholder="For example: a sunny morning ride"></textarea></label><button class="button dark full" type="submit">Send my activity <b>→</b></button></form></section></main>`)
  loadSubmissionEvents()
  document.querySelector('#submission-form').addEventListener('submit', submitProof)
}

async function loadSubmissionEvents() {
  const select = document.querySelector('#submission-event')
  const submitButton = document.querySelector('#submission-form button')
  if (!supabase) {
    select.innerHTML = '<option value="">Event list unavailable</option>'
    submitButton.disabled = true
    return
  }

  const { data, error } = await supabase
    .from('events')
    .select('id, title, event_date')
    .eq('status', 'published')
    .order('event_date', { ascending: true })

  if (error) {
    console.error('Unable to load submission events:', error)
    select.innerHTML = '<option value="">Unable to load events</option>'
    submitButton.disabled = true
    return
  }

  if (!data?.length) {
    select.innerHTML = '<option value="">No events are available</option>'
    submitButton.disabled = true
    return
  }

  select.innerHTML = `<option value="">Choose an event</option>${data.map(event => `<option value="${escape(event.id)}">${escape(event.title)} · ${escape(event.event_date)}</option>`).join('')}`
}

async function submitProof(e) {
  e.preventDefault(); const form = e.currentTarget; const button = form.querySelector('button'); const fields = Object.fromEntries(new FormData(form)); const file = form.proof.files[0]
  if (!fields.activity_url && !file) return alert('Please add an activity link or upload a screenshot.')
  if (file && file.size > 8 * 1024 * 1024) return alert('Please upload a file smaller than 8 MB.')
  button.disabled = true; button.textContent = 'Submitting activity…'
  try {
    if (!supabase) throw new Error('Add your Supabase credentials to enable submissions.')
    let proof_base64 = null
    if (file) proof_base64 = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result.split(',')[1]); reader.onerror = reject; reader.readAsDataURL(file) })
    const { error } = await supabase.functions.invoke('submit-proof', { body: { ...fields, proof_base64, proof_name: file?.name, proof_type: file?.type } })
    if (error) throw error
    form.innerHTML = `<div class="success-box"><span>✓</span><h2>Run submitted!</h2><p>We’ll review your activity and email you when your medal is on its way.</p><a class="button warm" href="#/">Explore more events</a></div>`
  } catch (error) { alert(await readableFunctionError(error, 'Unable to submit. Please try again.')); button.disabled = false; button.innerHTML = 'Submit activity <b>→</b>' }
}

function success(id) { shell(`<main class="success-page"><div class="success-box"><span>✓</span><p class="eyebrow">You’re registered</p><h1>Your start line<br/>is wherever you are.</h1><p>Your payment is confirmed. Save your registration ID <strong>${escape(id)}</strong>, complete your run during the event window, then submit your proof.</p><div class="success-actions"><a class="button warm" href="#/submit">Submit a run later <b>→</b></a><a class="button dark" href="#/">Go to home <b>→</b></a></div></div></main>`) }

async function router() { const [, route = '', value] = window.location.hash.slice(1).split('/'); if (route === 'event') { const list = window.__events || await events(); window.__events = list; const event = bySlug(value); if (event) details(event); else home() } else if (route === 'submit') submission(); else if (route === 'success') success(value); else home() }
window.addEventListener('hashchange', router); router()
