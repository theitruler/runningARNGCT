alter table public.participants
  add column emergency_contact_name text,
  add column emergency_contact_relationship text,
  add column emergency_contact_phone text,
  add column medical_notes text,
  add column meetup_waiver_accepted boolean not null default false;
