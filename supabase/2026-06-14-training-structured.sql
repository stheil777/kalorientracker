-- Training strukturiert – 2026-06-14
-- Sportart, Dauer und berechnete kcal für Check-In

alter table public.daily_notes
  add column if not exists training_activity text,
  add column if not exists training_duration_min integer,
  add column if not exists training_kcal integer;
