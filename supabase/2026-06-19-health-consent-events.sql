begin;

create table if not exists public.user_consent_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null,
  consent_version text not null,
  event_type text not null check (event_type in ('granted', 'withdrawn')),
  consent_text text not null,
  occurred_at timestamptz not null default now()
);

create index if not exists user_consent_events_user_type_date_idx
on public.user_consent_events(user_id, consent_type, occurred_at desc);

create or replace function public.set_consent_event_occurred_at()
returns trigger
language plpgsql
as $$
begin
  new.occurred_at = now();
  return new;
end;
$$;

drop trigger if exists user_consent_events_set_occurred_at on public.user_consent_events;
create trigger user_consent_events_set_occurred_at
before insert on public.user_consent_events
for each row execute function public.set_consent_event_occurred_at();

alter table public.user_consent_events enable row level security;

drop policy if exists "user_consent_events_select_own" on public.user_consent_events;
create policy "user_consent_events_select_own" on public.user_consent_events
for select using (auth.uid() = user_id);

drop policy if exists "user_consent_events_insert_own" on public.user_consent_events;
create policy "user_consent_events_insert_own" on public.user_consent_events
for insert with check (auth.uid() = user_id);

commit;
