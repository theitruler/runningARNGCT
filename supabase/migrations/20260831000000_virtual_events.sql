-- Public event catalogue, plus private registration and proof records.
create extension if not exists pgcrypto;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  short_description text not null,
  description text not null,
  distance text not null,
  event_date text not null,
  registration_end text not null,
  fee integer not null check (fee > 0),
  image_url text not null,
  medal_text text,
  status text not null default 'draft' check (status in ('draft', 'published', 'closed')),
  created_at timestamptz not null default now()
);

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete restrict,
  name text not null,
  email text not null,
  phone text not null,
  shipping_address text not null,
  city text not null,
  pincode text not null,
  payment_status text not null default 'created' check (payment_status in ('created', 'paid', 'failed', 'refunded')),
  razorpay_order_id text unique,
  razorpay_payment_id text unique,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete cascade,
  activity_url text,
  proof_path text,
  note text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  check (activity_url is not null or proof_path is not null)
);

alter table public.events enable row level security;
alter table public.participants enable row level security;
alter table public.submissions enable row level security;

grant select on public.events to anon, authenticated;
create policy "published events are publicly visible" on public.events for select to anon, authenticated using (status = 'published');

-- Participant and submission writes are deliberately not exposed to the browser.
-- The Edge Functions below use the service-role key after validating payment/proof data.

-- Keep activity screenshots private; only server-side operations can read or write them.
insert into storage.buckets (id, name, public)
values ('run-proofs', 'run-proofs', false)
on conflict (id) do nothing;
