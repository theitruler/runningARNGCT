alter table public.participants
  add column distance_category text,
  add column sport_category text;

update public.participants
set distance_category = '10K', sport_category = 'Running'
where distance_category is null or sport_category is null;

alter table public.participants
  alter column distance_category set not null,
  alter column sport_category set not null,
  add constraint participants_distance_category_check
    check (distance_category in ('3K', '5K', '10K')),
  add constraint participants_sport_category_check
    check (sport_category in ('Walking', 'Running', 'Cycling'));
