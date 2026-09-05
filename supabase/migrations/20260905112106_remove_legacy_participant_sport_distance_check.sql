-- Race choices are configured per event in event_race_options and validated
-- by the payment functions. The old fixed list rejected valid event options.
alter table public.participants
  drop constraint if exists participants_sport_distance_check;
