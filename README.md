# Stride virtual events

A Vite site for virtual running events. Its home page reads published events from Supabase; registrations start a Razorpay checkout, and the participant is marked `paid` only after server-side signature verification. `/submit` accepts a Strava/activity link or a proof screenshot.

## Run locally

1. Copy `.env.example` to `.env.local` and add your Supabase project URL and **publishable** key.
2. Run `npm install`, then `npm run dev`.
3. Without environment values, the UI uses three demo events so it remains previewable.

## Deploy with Coolify

1. Create a GitHub repository and push this project to it.
2. In Coolify, create a **Dockerfile** application from that repository. The included `Dockerfile` builds the Vite app and Nginx serves it on port `8080`.
3. Set the app's exposed port to `8080`.
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` as **build-time** environment variables in Coolify. Do not put Razorpay secrets or a Supabase service-role key into the browser build; keep those only in Supabase Edge Function secrets.

## Configure Supabase

1. Run `supabase/migrations/20260831000000_virtual_events.sql` in the Supabase SQL editor. It creates the private `run-proofs` bucket used for activity screenshots.
2. Deploy `create-order`, `verify-payment`, and `submit-proof` as Edge Functions.
3. In Edge Function secrets, set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`. Supabase’s `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided by the runtime.
4. Add `published` event rows in `public.events`. Do not put a Razorpay secret or a Supabase service-role key in the browser environment.

For reliable production payment reconciliation, configure a Razorpay `payment.captured` webhook that independently confirms the order and marks the matching participant paid. The checkout callback here is signature-verified and gives immediate UX feedback; the webhook covers interrupted browser sessions.
