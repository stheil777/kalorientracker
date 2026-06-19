begin;

drop policy if exists "meal_entries_update_own" on public.meal_entries;
create policy "meal_entries_update_own" on public.meal_entries
for update using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.profiles
    where profiles.id = meal_entries.profile_id
    and profiles.user_id = auth.uid()
  )
);

drop policy if exists "favorite_meals_update_own" on public.favorite_meals;
create policy "favorite_meals_update_own" on public.favorite_meals
for update using (auth.uid() = user_id)
with check (
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

drop policy if exists "daily_notes_update_own" on public.daily_notes;
create policy "daily_notes_update_own" on public.daily_notes
for update using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.profiles
    where profiles.id = daily_notes.profile_id
    and profiles.user_id = auth.uid()
  )
);

commit;
