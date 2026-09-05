alter table public.participants
  drop constraint if exists participants_reddit_url_check;

alter table public.participants
  add constraint participants_reddit_url_check
  check (reddit_url is null or reddit_url ~* '^https?://(www\.)?reddit\.com/(u|user)/[^/?#]+/?$');
