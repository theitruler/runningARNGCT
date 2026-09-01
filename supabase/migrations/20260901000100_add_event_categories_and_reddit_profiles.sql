alter table public.events
  add column category text not null default 'virtual'
  check (category in ('virtual', 'real_meetup', 'reddit'));

alter table public.participants
  add column reddit_url text
  check (reddit_url is null or reddit_url ~* '^https?://(www\\.)?reddit\\.com/user/[^/?#]+/?$');

update public.events set category = 'real_meetup' where slug = 'coastal-half';
update public.events set category = 'reddit' where slug = 'sunrise-5k';
