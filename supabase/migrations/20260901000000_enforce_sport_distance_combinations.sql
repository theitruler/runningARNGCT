alter table public.participants
  drop constraint participants_distance_category_check,
  drop constraint participants_sport_category_check;

alter table public.participants
  add constraint participants_sport_distance_check check (
    (sport_category = 'Walking' and distance_category in ('3K', '5K'))
    or (sport_category = 'Running' and distance_category in ('3K', '5K', '10K', '21K'))
    or (sport_category = 'Cycling' and distance_category in ('10K', '20K', '50K'))
  );
