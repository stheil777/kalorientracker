create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (name in ('Stephan', 'Jen')),
  calorie_goal integer not null default 2000,
  protein_goal integer not null default 120,
  carbs_goal integer not null default 200,
  fat_goal integer not null default 70,
  current_weight numeric(6, 2),
  height_cm integer,
  age integer,
  sex text check (sex in ('male', 'female')),
  activity_level text check (activity_level in ('low', 'light', 'moderate', 'high')),
  goal_type text check (goal_type in ('lose', 'maintain', 'gain')),
  diet_type text check (diet_type in ('balanced', 'high_protein', 'vegetarian', 'vegan', 'low_carb')),
  calculated_tdee integer,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table public.meal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  date date not null default current_date,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  food_name text not null,
  amount text not null default '',
  calories integer not null default 0 check (calories >= 0),
  protein numeric(8, 2) not null default 0 check (protein >= 0),
  carbs numeric(8, 2) not null default 0 check (carbs >= 0),
  fat numeric(8, 2) not null default 0 check (fat >= 0),
  created_at timestamptz not null default now()
);

create table public.favorite_meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  name text not null,
  amount text not null default '',
  meal_type text not null default 'snack' check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  calories integer not null default 0 check (calories >= 0),
  protein numeric(8, 2) not null default 0 check (protein >= 0),
  carbs numeric(8, 2) not null default 0 check (carbs >= 0),
  fat numeric(8, 2) not null default 0 check (fat >= 0),
  created_at timestamptz not null default now()
);

create table public.daily_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  date date not null default current_date,
  weight numeric(6, 2),
  training boolean not null default false,
  water_intake numeric(5, 2),
  sleep_quality integer check (sleep_quality between 1 and 5),
  energy_level integer check (energy_level between 1 and 5),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, profile_id, date)
);

create index meal_entries_user_profile_date_idx on public.meal_entries(user_id, profile_id, date);
create index favorite_meals_user_profile_idx on public.favorite_meals(user_id, profile_id);
create index daily_notes_user_profile_date_idx on public.daily_notes(user_id, profile_id, date);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger daily_notes_set_updated_at
before update on public.daily_notes
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.meal_entries enable row level security;
alter table public.favorite_meals enable row level security;
alter table public.daily_notes enable row level security;

create policy "profiles_select_own" on public.profiles
for select using (auth.uid() = user_id);

create policy "profiles_insert_own" on public.profiles
for insert with check (auth.uid() = user_id);

create policy "profiles_update_own" on public.profiles
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "profiles_delete_own" on public.profiles
for delete using (auth.uid() = user_id);

create policy "meal_entries_select_own" on public.meal_entries
for select using (auth.uid() = user_id);

create policy "meal_entries_insert_own" on public.meal_entries
for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.profiles
    where profiles.id = meal_entries.profile_id
    and profiles.user_id = auth.uid()
  )
);

create policy "meal_entries_update_own" on public.meal_entries
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "meal_entries_delete_own" on public.meal_entries
for delete using (auth.uid() = user_id);

create policy "favorite_meals_select_own" on public.favorite_meals
for select using (auth.uid() = user_id);

create policy "favorite_meals_insert_own" on public.favorite_meals
for insert with check (
  auth.uid() = user_id
  and (
    profile_id is null
    or exists (
      select 1 from public.profiles
      where profiles.id = favorite_meals.profile_id
      and profiles.user_id = auth.uid()
    )
  )
);

create policy "favorite_meals_update_own" on public.favorite_meals
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "favorite_meals_delete_own" on public.favorite_meals
for delete using (auth.uid() = user_id);

create policy "daily_notes_select_own" on public.daily_notes
for select using (auth.uid() = user_id);

create policy "daily_notes_insert_own" on public.daily_notes
for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.profiles
    where profiles.id = daily_notes.profile_id
    and profiles.user_id = auth.uid()
  )
);

create policy "daily_notes_update_own" on public.daily_notes
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "daily_notes_delete_own" on public.daily_notes
for delete using (auth.uid() = user_id);
