begin;

alter table public.profiles
add column cycle_start_date date;

alter table public.daily_notes
add column period_start boolean not null default false,
add column flow text,
add column symptoms jsonb not null default '[]'::jsonb,
add constraint daily_notes_flow_check
  check (flow is null or flow in ('light', 'medium', 'heavy')),
add constraint daily_notes_symptoms_array_check
  check (jsonb_typeof(symptoms) = 'array');

commit;
