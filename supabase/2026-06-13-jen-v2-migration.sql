-- Jen v2 Migration – 2026-06-13
-- Neue Check-In Felder und Profil-Erweiterung (Anamnesebogen)

-- daily_notes: neue Felder
alter table public.daily_notes
  add column if not exists satiation integer check (satiation between 1 and 5),
  add column if not exists mood integer check (mood between 1 and 5),
  add column if not exists cravings text;

-- profiles: neue Felder (Anamnesebogen)
alter table public.profiles
  add column if not exists target_weight numeric(6, 2),
  add column if not exists training_frequency integer check (training_frequency between 0 and 7),
  add column if not exists cycle_relevant boolean default false,
  add column if not exists sleep_goal_hours numeric(3, 1),
  add column if not exists intolerances text,
  add column if not exists no_go_foods text,
  add column if not exists favorite_foods text,
  add column if not exists alcohol_frequency text,
  add column if not exists alcohol_amount text;
