begin;

create table public.daily_training_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  date date not null default current_date,
  activity text not null,
  duration_min integer not null check (duration_min between 5 and 300),
  calories integer not null default 0 check (calories >= 0),
  created_at timestamptz not null default now()
);

create index daily_training_entries_user_profile_date_idx
on public.daily_training_entries(user_id, profile_id, date);

alter table public.daily_training_entries enable row level security;

create policy "daily_training_entries_select_own" on public.daily_training_entries
for select using ((select auth.uid()) = user_id);

create policy "daily_training_entries_insert_own" on public.daily_training_entries
for insert with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.profiles
    where profiles.id = daily_training_entries.profile_id
    and profiles.user_id = (select auth.uid())
  )
);

create policy "daily_training_entries_update_own" on public.daily_training_entries
for update using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1 from public.profiles
    where profiles.id = daily_training_entries.profile_id
    and profiles.user_id = (select auth.uid())
  )
);

create policy "daily_training_entries_delete_own" on public.daily_training_entries
for delete using ((select auth.uid()) = user_id);

insert into public.daily_training_entries (
  user_id,
  profile_id,
  date,
  activity,
  duration_min,
  calories
)
select
  user_id,
  profile_id,
  date,
  coalesce(training_activity, 'training'),
  greatest(5, least(300, coalesce(training_duration_min, 30))),
  greatest(0, coalesce(training_kcal, 0))
from public.daily_notes
where training = true;

commit;
