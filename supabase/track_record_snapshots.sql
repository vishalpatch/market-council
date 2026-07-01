-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Price snapshots captured when a committee analysis is saved, so the Track
-- Record page can compare submission price vs. current price over time.

create table if not exists public.track_record_snapshots (
  id                   uuid        primary key default gen_random_uuid(),
  user_id              uuid        not null references auth.users (id) on delete cascade,
  analysis_id          uuid        references public.committee_analyses (id) on delete cascade,
  ticker               text        not null,
  price_at_submission  numeric     not null,
  submitted_at         timestamptz not null default now()
);

create index if not exists track_record_snapshots_user_idx
  on public.track_record_snapshots (user_id, submitted_at desc);

alter table public.track_record_snapshots enable row level security;

drop policy if exists "Users manage own snapshots" on public.track_record_snapshots;
create policy "Users manage own snapshots"
  on public.track_record_snapshots
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
