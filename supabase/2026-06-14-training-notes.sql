-- Training Notes – 2026-06-14
-- Freitextfeld für "was hast du heute trainiert?"

alter table public.daily_notes
  add column if not exists training_notes text;
